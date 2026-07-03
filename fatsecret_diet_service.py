import json
import sys
import requests
import hashlib
import hmac
import base64
import time
import urllib.parse
from flask import Flask, request, jsonify
from typing import Dict, List
import os
import random

# FatSecret API Configuration
FATSECRET_CLIENT_ID = "4f1ef06c051342c9bb768dfcd06b230b"
FATSECRET_CLIENT_SECRET = "7733e5334a464be1a17583f5bbd53481"
FATSECRET_BASE_URL = "https://platform.fatsecret.com/rest/server.api"

def calculate_bmi(weight: float, height: float) -> float:
    """Calculate BMI using weight in kg and height in cm"""
    height_m = height / 100
    return weight / (height_m * height_m)

def calculate_bmr(weight: float, height: float, age: int, gender: str) -> float:
    """Calculate BMR using Mifflin-St Jeor Equation"""
    if not gender:
        gender = "male"
        
    if gender.lower() == "male":
        return (10 * weight) + (6.25 * height) - (5 * age) + 5
    return (10 * weight) + (6.25 * height) - (5 * age) - 161

def calculate_daily_calories(bmr: float, activity_level: str, goal: str, bmi: float, user_data: dict) -> Dict[str, float]:
    """Calculate TDEE and macronutrient targets"""
    try:
        weight_kg = float(user_data.get('weight', 70))
        height_cm = float(user_data.get('height', 170))
        age = int(user_data.get('age', 30))
        gender = user_data.get('gender', 'male').lower()
        
        activity_multipliers = {
            "sedentary": 1.2,
            "light": 1.375,
            "moderate": 1.55,
            "very_active": 1.725,
            "extra_active": 1.9
        }
        
        multiplier = activity_multipliers.get(activity_level.lower().replace(' ', '_'), 1.55)
        tdee = bmr * multiplier
        
        weekly_weight_change = user_data.get('weekly_weight_change', 0)
        
        if weekly_weight_change != 0:
            daily_calorie_adjustment = (weekly_weight_change * 7700) / 7
            if goal == 'weight_loss':
                daily_calorie_adjustment = -abs(daily_calorie_adjustment)
                protein_g = weight_kg * 2.2
                fat_ratio = 0.30
            else:
                daily_calorie_adjustment = abs(daily_calorie_adjustment)
                protein_g = weight_kg * 2.4
                fat_ratio = 0.25
            
            daily_calories = tdee + daily_calorie_adjustment
        else:
            if goal == "weight_loss":
                if bmi > 35: deficit = -750
                elif bmi > 30: deficit = -600
                elif bmi > 25: deficit = -500
                else: deficit = -300
                protein_g = weight_kg * (2.4 if bmi > 30 else 2.2)
                fat_ratio = 0.30
                daily_calories = tdee + deficit
                
            elif goal in ["weight_gain", "muscle_gain"]:
                if bmi < 18.5: surplus = 600
                elif bmi < 22: surplus = 500
                elif bmi < 25: surplus = 400
                else: surplus = 300
                protein_g = weight_kg * 2.6
                fat_ratio = 0.25
                daily_calories = tdee + surplus
                
            else:  # maintain
                daily_calories = tdee
                protein_g = weight_kg * 2.0
                fat_ratio = 0.28
        
        # Gender and age-based minimum calories
        if gender == "female":
            min_calories = 1200 if age < 50 else 1100
        else:
            min_calories = 1500 if age < 50 else 1400
            
        daily_calories = max(daily_calories, min_calories)
        
        # Calculate macronutrients
        protein_calories = protein_g * 4
        remaining_calories = daily_calories - protein_calories
        
        fat_calories = remaining_calories * fat_ratio
        carb_calories = remaining_calories * (1 - fat_ratio)
        
        fat_g = fat_calories / 9
        carb_g = carb_calories / 4
        
        fiber_g = min(35, max(25, daily_calories / 1000 * 14))
        water_ml = weight_kg * 35 + (500 if activity_level in ['very_active', 'extra_active'] else 0)
        
        return {
            "daily_calories": round(daily_calories),
            "protein": round(protein_g),
            "carbs": round(carb_g),
            "fat": round(fat_g),
            "fiber": round(fiber_g),
            "water_ml": round(water_ml),
            "tdee": round(tdee),
            "bmr": round(bmr),
            "bmi": round(bmi, 1)
        }
        
    except Exception as e:
        print(f"Error in calculate_daily_calories: {str(e)}", file=sys.stderr)
        return {
            "daily_calories": 2000,
            "protein": 150,
            "carbs": 250,
            "fat": 67,
            "fiber": 30,
            "water_ml": 2500,
            "tdee": 2000,
            "bmr": 1600,
            "bmi": 22.0
        }

class FatSecretAPI:
    def __init__(self, client_id: str, client_secret: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self.base_url = FATSECRET_BASE_URL
        
    def _generate_oauth_signature(self, method: str, url: str, params: dict) -> str:
        """Generate OAuth 1.0 signature"""
        # Create parameter string
        param_string = '&'.join([f"{k}={urllib.parse.quote(str(v), safe='')}"
                                for k, v in sorted(params.items())])
        
        # Create signature base string
        base_string = f"{method}&{urllib.parse.quote(url, safe='')}&{urllib.parse.quote(param_string, safe='')}"
        
        # Create signing key
        signing_key = f"{urllib.parse.quote(self.client_secret, safe='')}&"
        
        # Generate signature
        signature = hmac.new(
            signing_key.encode('utf-8'),
            base_string.encode('utf-8'),
            hashlib.sha1
        ).digest()
        
        return base64.b64encode(signature).decode('utf-8')
    
    def search_recipes(self, search_expression: str = None, max_results: int = 20) -> List[dict]:
        """Search for recipes using FatSecret OAuth 1.0 API"""
        try:
            # OAuth parameters
            oauth_params = {
                'oauth_consumer_key': self.client_id,
                'oauth_nonce': str(int(time.time() * 1000)),
                'oauth_signature_method': 'HMAC-SHA1',
                'oauth_timestamp': str(int(time.time())),
                'oauth_version': '1.0'
            }
            
            # API parameters
            api_params = {
                'method': 'recipes.search',
                'format': 'json',
                'max_results': str(max_results)
            }
            
            if search_expression:
                api_params['search_expression'] = search_expression
            
            # Combine all parameters
            all_params = {**oauth_params, **api_params}
            
            # Generate signature
            signature = self._generate_oauth_signature('GET', self.base_url, all_params)
            all_params['oauth_signature'] = signature
            
            print(f"Searching for recipes with term: '{search_expression}'", file=sys.stderr)
            
            response = requests.get(self.base_url, params=all_params, timeout=10)
            
            print(f"API Response Status: {response.status_code}", file=sys.stderr)
            print(f"API Response: {response.text[:200]}...", file=sys.stderr)
            
            response.raise_for_status()
            result = response.json()
            
            if 'recipes' in result and 'recipe' in result['recipes']:
                recipes = result['recipes']['recipe']
                if isinstance(recipes, dict):
                    recipes = [recipes]
                return recipes
            
            return []
            
        except Exception as e:
            print(f"FatSecret API error: {str(e)}", file=sys.stderr)
            return []

def search_recipes_by_macros(api: FatSecretAPI, target_calories: int, target_protein: int, 
                           target_carbs: int, target_fat: int, meal_type: str, 
                           goal: str, day_seed: int = 0) -> List[dict]:
    """Search for recipes that match macro requirements"""
    
    # Define search terms based on meal type
    meal_search_terms = {
        'breakfast': ['breakfast', 'pancakes', 'oatmeal', 'eggs'],
        'lunch': ['lunch', 'salad', 'sandwich', 'soup'],
        'dinner': ['dinner', 'chicken', 'beef', 'fish'],
        'snack': ['snack', 'protein', 'healthy']
    }
    
    # Get search term for this meal type
    meal_terms = meal_search_terms.get(meal_type, ['healthy'])
    
    # Use day_seed to vary search terms
    if day_seed > 0:
        random.seed(day_seed + hash(meal_type))
        search_term = random.choice(meal_terms)
    else:
        search_term = meal_terms[0]
    
    # Search for recipes
    recipes = api.search_recipes(search_expression=search_term, max_results=10)
    
    # Process and score recipes
    scored_recipes = []
    
    for recipe in recipes:
        try:
            recipe_id = recipe.get('recipe_id')
            recipe_name = recipe.get('recipe_name', 'Unknown Recipe')
            recipe_description = recipe.get('recipe_description', '')
            recipe_image = recipe.get('recipe_image', '')
            
            # Estimate nutrition based on recipe name and description
            calories = estimate_calories_from_description(recipe_name, recipe_description, target_calories)
            protein = int(calories * 0.2 / 4)  # 20% protein
            carbs = int(calories * 0.5 / 4)    # 50% carbs
            fat = int(calories * 0.3 / 9)      # 30% fat
            
            # Get ingredients if available
            ingredients = []
            if 'recipe_ingredients' in recipe:
                if isinstance(recipe['recipe_ingredients'], list):
                    ingredients = [ing.get('ingredient_description', '') for ing in recipe['recipe_ingredients']]
                else:
                    ingredients = [recipe['recipe_ingredients'].get('ingredient_description', '')]
            
            # Score recipe based on how well it matches targets
            calorie_score = 100 - min(50, abs(calories - target_calories) / target_calories * 100)
            protein_score = 100 - min(50, abs(protein - target_protein) / max(target_protein, 1) * 100)
            
            total_score = (calorie_score + protein_score) / 2
            
            scored_recipes.append({
                'recipe_id': recipe_id,
                'name': recipe_name,
                'description': recipe_description,
                'image': recipe_image,
                'calories': calories,
                'protein': protein,
                'carbs': carbs,
                'fat': fat,
                'ingredients': ingredients,
                'score': total_score,
                'meal_type': meal_type
            })
                
        except Exception as e:
            print(f"Error processing recipe: {str(e)}", file=sys.stderr)
            continue
    
    # Sort by score and return top results
    scored_recipes.sort(key=lambda x: x['score'], reverse=True)
    return scored_recipes[:5]

def estimate_calories_from_description(name: str, description: str, target_calories: int) -> int:
    """Estimate calories based on recipe name and description"""
    # This is a simplified estimation - in production you'd use the actual nutrition data
    
    # High calorie indicators
    high_cal_words = ['fried', 'butter', 'cream', 'cheese', 'chocolate', 'cake', 'pie', 'oil']
    low_cal_words = ['salad', 'steamed', 'grilled', 'baked', 'vegetable', 'fruit', 'light']
    
    text = (name + ' ' + description).lower()
    
    # Base estimate around target
    base_calories = target_calories
    
    # Adjust based on keywords
    high_cal_count = sum(1 for word in high_cal_words if word in text)
    low_cal_count = sum(1 for word in low_cal_words if word in text)
    
    if high_cal_count > low_cal_count:
        return min(base_calories + 100, target_calories * 1.3)
    elif low_cal_count > high_cal_count:
        return max(base_calories - 100, target_calories * 0.7)
    else:
        return base_calories

def select_recipes_with_fatsecret(daily_calories: float, num_meals: int = 3, goal: str = "maintain", 
                                user_data: dict = None, day_seed: int = 0) -> List[Dict]:
    """Select recipes using FatSecret API with optimized calorie distribution"""
    
    # Initialize FatSecret API
    api = FatSecretAPI(FATSECRET_CLIENT_ID, FATSECRET_CLIENT_SECRET)
    
    # Optimized calorie distribution based on meal timing and goals
    if goal == "weight_loss":
        # Higher protein breakfast, moderate lunch, lighter dinner
        calorie_distribution = {"breakfast": 0.30, "lunch": 0.40, "dinner": 0.30}
        protein_boost = {"breakfast": 1.3, "lunch": 1.1, "dinner": 1.0}
    elif goal in ["weight_gain", "muscle_gain"]:
        # Substantial breakfast, large lunch, hearty dinner
        calorie_distribution = {"breakfast": 0.25, "lunch": 0.35, "dinner": 0.40}
        protein_boost = {"breakfast": 1.2, "lunch": 1.3, "dinner": 1.4}
    else:  # maintain
        # Balanced distribution with slightly larger lunch
        calorie_distribution = {"breakfast": 0.25, "lunch": 0.40, "dinner": 0.35}
        protein_boost = {"breakfast": 1.1, "lunch": 1.2, "dinner": 1.0}
    
    # Define meal types with snacks if needed
    if num_meals == 3:
        meal_types = ["breakfast", "lunch", "dinner"]
    elif num_meals == 4:
        meal_types = ["breakfast", "lunch", "snack", "dinner"]
        calorie_distribution["snack"] = 0.15
        # Adjust other meals
        for meal in ["breakfast", "lunch", "dinner"]:
            calorie_distribution[meal] *= 0.85
    else:
        meal_types = ["breakfast", "snack", "lunch", "snack", "dinner"][:num_meals]
    
    selected_recipes = []
    
    for i, meal_type in enumerate(meal_types):
        # Calculate target calories based on optimized distribution
        if meal_type in calorie_distribution:
            target_calories = int(daily_calories * calorie_distribution[meal_type])
        else:
            target_calories = int(daily_calories * 0.15)  # Default for snacks
        
        # Calculate target macros with meal-specific adjustments
        base_protein_ratio = 0.25 if goal in ["weight_gain", "muscle_gain"] else 0.20
        protein_multiplier = protein_boost.get(meal_type, 1.0)
        
        target_protein = int(target_calories * base_protein_ratio * protein_multiplier / 4)
        
        # Adjust carbs and fats based on meal type
        if meal_type == "breakfast":
            # Higher carbs for energy
            target_carbs = int(target_calories * 0.50 / 4)
            target_fat = int(target_calories * 0.25 / 9)
        elif meal_type == "lunch":
            # Balanced macros
            target_carbs = int(target_calories * 0.45 / 4)
            target_fat = int(target_calories * 0.30 / 9)
        elif meal_type == "dinner":
            # Lower carbs, higher protein and fats
            target_carbs = int(target_calories * 0.35 / 4)
            target_fat = int(target_calories * 0.40 / 9)
        else:  # snack
            target_carbs = int(target_calories * 0.40 / 4)
            target_fat = int(target_calories * 0.35 / 9)
        
        # Search for recipes matching this meal with enhanced variety
        recipes = search_recipes_by_macros(
            api, target_calories, target_protein, target_carbs, target_fat,
            meal_type, goal, day_seed + i * 17  # Better seed distribution
        )
        
        if recipes:
            # Select the best recipe for this meal
            recipe = recipes[0]
            
            # Format recipe for frontend
            formatted_recipe = {
                "recipe_id": recipe['recipe_id'],
                "name": recipe['name'],
                "category": "main_course",
                "calories": target_calories,  # Use calculated target calories
                "protein": target_protein,    # Use calculated target protein
                "carbs": target_carbs,        # Use calculated target carbs
                "fat": target_fat,            # Use calculated target fat
                "instructions": [recipe.get('description', 'Visit FatSecret for full recipe')],
                "ingredients": recipe.get('ingredients', ['Check FatSecret for ingredients']),
                "rating": 4.0,
                "image_url": recipe.get('image', ''),
                "meal_type": meal_type,
                "protein_density": round((target_protein * 4 / target_calories) * 100, 1) if target_calories > 0 else 0,
                "goal_alignment": round(recipe['score'], 1),
                "meal_timing": get_meal_timing(meal_type),
                "portion_size": get_portion_guidance(target_calories, meal_type)
            }
            
            selected_recipes.append(formatted_recipe)
        else:
            # Fallback recipe with proper macro distribution
            fallback_recipe = {
                "recipe_id": f"fallback_{meal_type}_{day_seed}",
                "name": get_meal_name(meal_type, goal),
                "category": "main_course",
                "calories": target_calories,
                "protein": target_protein,
                "carbs": target_carbs,
                "fat": target_fat,
                "instructions": get_meal_instructions(meal_type, goal),
                "ingredients": get_meal_ingredients(meal_type, goal),
                "rating": 4.0,
                "image_url": "",
                "meal_type": meal_type,
                "protein_density": round((target_protein * 4 / target_calories) * 100, 1) if target_calories > 0 else 0,
                "goal_alignment": 85.0,
                "meal_timing": get_meal_timing(meal_type),
                "portion_size": get_portion_guidance(target_calories, meal_type)
            }
            
            selected_recipes.append(fallback_recipe)
    
    return selected_recipes

def get_meal_timing(meal_type: str) -> str:
    """Get optimal timing for each meal type"""
    timings = {
        "breakfast": "7:00-9:00 AM",
        "lunch": "12:00-2:00 PM", 
        "dinner": "6:00-8:00 PM",
        "snack": "3:00-4:00 PM or 9:00-10:00 PM"
    }
    return timings.get(meal_type, "Flexible timing")

def get_portion_guidance(calories: int, meal_type: str) -> str:
    """Get portion size guidance based on calories and meal type"""
    if meal_type == "breakfast":
        if calories < 300: return "Light breakfast"
        elif calories < 450: return "Standard breakfast"
        else: return "Hearty breakfast"
    elif meal_type == "lunch":
        if calories < 400: return "Light lunch"
        elif calories < 600: return "Standard lunch"
        else: return "Large lunch"
    elif meal_type == "dinner":
        if calories < 350: return "Light dinner"
        elif calories < 550: return "Standard dinner"
        else: return "Large dinner"
    else:
        return "Snack portion"

def get_meal_name(meal_type: str, goal: str) -> str:
    """Generate appropriate meal names based on type and goal"""
    names = {
        "breakfast": {
            "weight_loss": "Protein-Rich Morning Start",
            "weight_gain": "Power Breakfast Bowl",
            "muscle_gain": "High-Protein Breakfast",
            "maintain": "Balanced Morning Meal"
        },
        "lunch": {
            "weight_loss": "Lean & Green Lunch",
            "weight_gain": "Hearty Midday Meal",
            "muscle_gain": "Muscle-Building Lunch",
            "maintain": "Balanced Lunch Plate"
        },
        "dinner": {
            "weight_loss": "Light Evening Meal",
            "weight_gain": "Substantial Dinner",
            "muscle_gain": "Recovery Dinner",
            "maintain": "Balanced Evening Meal"
        },
        "snack": {
            "weight_loss": "Smart Snack Choice",
            "weight_gain": "Energy Boost Snack",
            "muscle_gain": "Protein Power Snack",
            "maintain": "Healthy Snack"
        }
    }
    return names.get(meal_type, {}).get(goal, f"Healthy {meal_type.title()}")

def get_meal_instructions(meal_type: str, goal: str) -> List[str]:
    """Generate meal-specific instructions"""
    base_instructions = {
        "breakfast": [
            "Start your day with this nutritious meal",
            "Eat within 1-2 hours of waking up",
            "Include protein to maintain energy levels",
            "Pair with water or herbal tea"
        ],
        "lunch": [
            "Perfect midday fuel for sustained energy",
            "Eat when you feel moderately hungry",
            "Balance protein, carbs, and healthy fats",
            "Take time to eat mindfully"
        ],
        "dinner": [
            "End your day with this satisfying meal",
            "Eat 2-3 hours before bedtime",
            "Focus on protein and vegetables",
            "Keep portions appropriate for evening"
        ],
        "snack": [
            "Perfect between-meal energy boost",
            "Choose when you feel genuinely hungry",
            "Focus on protein or healthy fats",
            "Keep portions controlled"
        ]
    }
    return base_instructions.get(meal_type, ["Enjoy this healthy meal"])

def get_meal_ingredients(meal_type: str, goal: str) -> List[str]:
    """Generate appropriate ingredients based on meal type and goal"""
    ingredients = {
        "breakfast": {
            "weight_loss": ["Egg whites", "Spinach", "Berries", "Greek yogurt", "Oats"],
            "weight_gain": ["Whole eggs", "Avocado", "Nuts", "Whole grain toast", "Banana"],
            "muscle_gain": ["Protein powder", "Oats", "Berries", "Almond butter", "Milk"],
            "maintain": ["Eggs", "Vegetables", "Whole grains", "Fruit", "Yogurt"]
        },
        "lunch": {
            "weight_loss": ["Lean protein", "Mixed greens", "Vegetables", "Olive oil", "Quinoa"],
            "weight_gain": ["Chicken thigh", "Brown rice", "Avocado", "Nuts", "Vegetables"],
            "muscle_gain": ["Lean beef", "Sweet potato", "Broccoli", "Olive oil", "Quinoa"],
            "maintain": ["Fish or chicken", "Mixed vegetables", "Whole grains", "Healthy fats"]
        },
        "dinner": {
            "weight_loss": ["White fish", "Steamed vegetables", "Leafy greens", "Herbs", "Lemon"],
            "weight_gain": ["Salmon", "Quinoa", "Roasted vegetables", "Nuts", "Olive oil"],
            "muscle_gain": ["Lean steak", "Sweet potato", "Asparagus", "Garlic", "Herbs"],
            "maintain": ["Protein of choice", "Vegetables", "Complex carbs", "Healthy fats"]
        },
        "snack": {
            "weight_loss": ["Apple", "Almond butter", "Celery", "Hummus"],
            "weight_gain": ["Trail mix", "Dried fruit", "Nuts", "Seeds"],
            "muscle_gain": ["Protein bar", "Greek yogurt", "Berries", "Granola"],
            "maintain": ["Mixed nuts", "Fruit", "Yogurt", "Vegetables"]
        }
    }
    return ingredients.get(meal_type, {}).get(goal, ["Healthy ingredients"])

app = Flask(__name__)
from flask_cors import CORS

CORS(app, resources={
    r"/api/diet/recommend": {
        "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": True,
        "max_age": 3600
    }
})

@app.route('/api/diet/recommend', methods=['POST'])
def recommend_diet():
    try:
        data = request.get_json()
        
        # Calculate BMI and BMR
        weight = float(data['weight'])
        height = float(data['height'])
        age = int(data['age'])
        gender = data['gender']
        activity_level = data['activity_level']
        goal = data['goal']
        weekly_weight_change = data.get('weekly_weight_change', 0)
        
        bmi = calculate_bmi(weight, height)
        bmr = calculate_bmr(weight, height, age, gender)
        
        # Calculate daily calorie and macro targets
        targets = calculate_daily_calories(bmr, activity_level, goal, bmi, data)
        
        # Select recipes using FatSecret API
        meal_count = int(data.get('meal_count', 3))
        day_seed = data.get('day_seed', 0)
        
        print(f"Processing request with day_seed: {day_seed}, Goal: {goal}, Daily calories: {targets['daily_calories']}", file=sys.stderr)
        
        meal_recommendations = select_recipes_with_fatsecret(
            targets['daily_calories'], meal_count, goal, data, day_seed
        )
        
        # Debug output
        for i, meal in enumerate(meal_recommendations):
            print(f"Meal {i+1}: {meal['name']}, Calories: {meal['calories']}", file=sys.stderr)
        
        # Calculate analytics
        total_meal_calories = sum(meal['calories'] for meal in meal_recommendations)
        total_meal_protein = sum(meal['protein'] for meal in meal_recommendations)
        total_meal_carbs = sum(meal['carbs'] for meal in meal_recommendations)
        total_meal_fat = sum(meal['fat'] for meal in meal_recommendations)
        
        response = {
            **targets,
            "meals": meal_recommendations,
            "meal_analytics": {
                "total_meal_calories": total_meal_calories,
                "total_meal_protein": total_meal_protein,
                "total_meal_carbs": total_meal_carbs,
                "total_meal_fat": total_meal_fat,
                "calorie_accuracy": round((total_meal_calories / targets['daily_calories']) * 100, 1),
                "protein_accuracy": round((total_meal_protein / targets['protein']) * 100, 1),
                "avg_meal_rating": round(sum(meal['rating'] for meal in meal_recommendations) / len(meal_recommendations), 1) if meal_recommendations else 0
            },
            "goal_insights": {
                "goal": goal,
                "bmi_category": "Underweight" if bmi < 18.5 else "Normal" if bmi < 25 else "Overweight" if bmi < 30 else "Obese",
                "daily_deficit_surplus": targets['daily_calories'] - targets['tdee'],
                "weekly_weight_change_estimate": round((targets['daily_calories'] - targets['tdee']) * 7 / 3500, 2)
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        import traceback
        print(f"ERROR in recommend_diet: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return jsonify({
            "error": "An internal server error occurred while generating recommendations.",
            "daily_calories": 2000,
            "protein": 150,
            "carbs": 250,
            "fat": 67,
            "meals": []
        }), 500

if __name__ == '__main__':
    app.run(port=3000, debug=True)
import json
import sys
import pandas as pd
from flask import Flask, request, jsonify
from typing import Dict, List
import os
import numpy as np
from sklearn.cluster import KMeans
import re

def calculate_bmi(weight: float, height: float) -> float:
    """Calculate BMI using weight in kg and height in cm
    
    Args:
        weight: Weight in kilograms
        height: Height in centimeters
    """
    height_m = height / 100
    return weight / (height_m * height_m)

def calculate_bmr(weight: float, height: float, age: int, gender: str) -> float:
    """
    Calculate BMR using Mifflin-St Jeor Equation with gender consideration
    
    Args:
        weight: Weight in kilograms
        height: Height in centimeters
        age: Age in years
        gender: 'male' or 'female'
    """
    if not gender:
        gender = "male"  # Default to male if not specified
        
    if gender.lower() == "male":
        return (10 * weight) + (6.25 * height) - (5 * age) + 5
    return (10 * weight) + (6.25 * height) - (5 * age) - 161

def cluster_recipes(df: pd.DataFrame, n_clusters: int = 3) -> pd.DataFrame:
    """Use K-means clustering to group recipes by nutritional content"""
    features = ['Calories', 'ProteinContent', 'CarbohydrateContent', 'FatContent']
    
    # Prepare features for clustering
    X = df[features].fillna(0)
    X = ((X - X.mean()) / X.std()).fillna(0)  # Standardize features, handle std dev of 0
    
    # Apply K-means clustering
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    df['cluster'] = kmeans.fit_predict(X)
    
    return df

def calculate_daily_calories(bmr: float, activity_level: str, goal: str, bmi: float, user_data: dict) -> Dict[str, float]:
    """
    Advanced TDEE and macronutrient calculation with extensive goal-based optimization
    """
    try:
        weight_kg = float(user_data.get('weight', 70))
        height_cm = float(user_data.get('height', 170))
        age = int(user_data.get('age', 30))
        gender = user_data.get('gender', 'male').lower()
        
        # Enhanced activity multipliers with more precision
        activity_multipliers = {
            "sedentary": 1.2,
            "light": 1.375,
            "moderate": 1.55,
            "very_active": 1.725,
            "extra_active": 1.9
        }
        
        multiplier = activity_multipliers.get(activity_level.lower().replace(' ', '_'), 1.55)
        tdee = bmr * multiplier
        
        # Check for weekly weight change target
        weekly_weight_change = user_data.get('weekly_weight_change', 0)
        
        if weekly_weight_change != 0:
            # Calculate calorie adjustment based on weekly weight change target
            # 1 kg = 7700 calories, so weekly change * 7700 / 7 days = daily adjustment
            if goal == 'weight_loss':
                daily_calorie_adjustment = -(weekly_weight_change * 7700) / 7  # Negative for weight loss
                protein_g = weight_kg * 2.2
                fat_ratio = 0.30
            else:  # Weight gain
                daily_calorie_adjustment = (weekly_weight_change * 7700) / 7
                protein_g = weight_kg * 2.4
                fat_ratio = 0.25
            
            daily_calories = tdee + daily_calorie_adjustment
        else:
            # Fallback to goal-based calculations
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
        
        # Calculate macronutrients with precision
        protein_calories = protein_g * 4
        remaining_calories = daily_calories - protein_calories
        
        fat_calories = remaining_calories * fat_ratio
        carb_calories = remaining_calories * (1 - fat_ratio)
        
        fat_g = fat_calories / 9
        carb_g = carb_calories / 4
        
        # Additional micronutrient recommendations
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
        print(f"Error in calculate_daily_calories: {str(e)}")
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

def clean_dataset(df: pd.DataFrame) -> pd.DataFrame:
    # Clean string columns
    str_columns = ['Name', 'Images', 'RecipeIngredientParts', 'RecipeInstructions']
    for col in str_columns:
        if col in df.columns:
            df[col] = df[col].fillna('').astype(str)
            # Remove c() and quotes, handling nested quotes and commas
            df[col] = df[col].str.replace(r'^c\(|\)$', '', regex=True)
            df[col] = df[col].str.replace(r'^["\'](.*?)["\']$', r'\1', regex=True)
    
    # Clean numeric columns and ensure positive values
    num_columns = ['Calories', 'ProteinContent', 'CarbohydrateContent', 'FatContent']
    for col in num_columns:
        if col in df.columns:
            # Convert to string first, then extract numeric values
            df[col] = df[col].astype(str)
            df[col] = pd.to_numeric(df[col].str.extract(r'([-+]?\d*\.?\d+)', expand=False), errors='coerce')
            df[col] = df[col].fillna(0).clip(lower=0)
    
    # Clean and validate image URLs
    def clean_image_url(url):
        if not isinstance(url, str) or not url or url == 'character(0)':
            return ''
        
        # Handle various URL formats in the dataset
        if 'https://' in url:
            # Try different patterns to extract URLs
            patterns = [
                r'"(https://img\.sndimg\.com/[^"]*?)"',  # Quoted URLs
                r'(https://img\.sndimg\.com/[^\s,)"\\]+)',  # Unquoted URLs
            ]
            
            for pattern in patterns:
                matches = re.findall(pattern, url)
                if matches:
                    clean_url = matches[0].strip('"\r\n\\').rstrip(',')
                    # Ensure URL is complete
                    if len(clean_url) > 50 and '.jpg' in clean_url:
                        return clean_url
        
        return ''
    
    df['Images'] = df['Images'].apply(clean_image_url)
    
    # Clean ingredients and instructions
    def clean_list_content(x):
        if pd.isna(x) or not str(x).strip():
            return []
        
        x = str(x).strip()
        
        # Handle simple cases first
        if not x or x == 'character(0)' or x == 'nan':
            return []
        
        # Remove c() wrapper
        x = re.sub(r'^c\(|\)$', '', x)
        
        # Simple split and clean approach
        if '"' in x:
            # Extract quoted items
            items = re.findall(r'"([^"]+)"', x)
        else:
            # Split by comma
            items = [item.strip() for item in x.split(',')]
        
        # Clean and filter items
        cleaned_items = []
        for item in items:
            item = item.strip().strip('"\'')
            if item and item not in cleaned_items:
                cleaned_items.append(item)
        
        return cleaned_items[:10]  # Limit to 10 items
    
    if 'RecipeIngredientParts' in df.columns:
        df['RecipeIngredientParts'] = df['RecipeIngredientParts'].apply(clean_list_content)
    if 'RecipeInstructions' in df.columns:
        df['RecipeInstructions'] = df['RecipeInstructions'].apply(clean_list_content)
    
    # Remove any rows with invalid data
    df = df.dropna(subset=['Name', 'Calories'])
    df = df[df['Calories'] > 0]
    
    return df

def select_recipes(df: pd.DataFrame, daily_calories: float, num_meals: int = 3, goal: str = "maintain", user_data: dict = None, day_seed: int = 0) -> List[Dict]:
    try:
        print(f"Starting select_recipes with {len(df)} recipes, day_seed: {day_seed}", file=sys.stderr)
        
        # Clean dataset
        df = clean_dataset(df)
        print(f"After cleaning: {len(df)} recipes", file=sys.stderr)
        
        # Apply clustering to recipes
        df = cluster_recipes(df)
        calories_per_meal = daily_calories / num_meals
        tolerance = 0.3
        min_calories = max(100, calories_per_meal * (1 - tolerance))
        max_calories = calories_per_meal * (1 + tolerance)
        
        # Filter recipes within calorie range
        suitable_recipes = df[
            (df['Calories'] >= min_calories) &
            (df['Calories'] <= max_calories)
        ].copy()
        
        if len(suitable_recipes) < num_meals:
            # If not enough recipes in range, expand tolerance
            tolerance = 0.5
            min_calories = max(100, calories_per_meal * (1 - tolerance))
            max_calories = calories_per_meal * (1 + tolerance)
            suitable_recipes = df[
                (df['Calories'] >= min_calories) &
                (df['Calories'] <= max_calories)
            ].copy()
        
        # Ensure we have enough recipes
        if len(suitable_recipes) < num_meals:
            # If still not enough, take closest matches
            suitable_recipes = df.copy()
            suitable_recipes['calorie_diff'] = abs(suitable_recipes['Calories'] - calories_per_meal)
            suitable_recipes = suitable_recipes.nsmallest(num_meals * 2, 'calorie_diff')
        
        # Goal-based recipe selection with nutritional optimization
        selected_recipes = []
        clusters = suitable_recipes['cluster'].unique()
        
        # Define meal types based on count
        if num_meals == 3:
            meal_types = ["breakfast", "lunch", "dinner"]
        elif num_meals == 4:
            meal_types = ["breakfast", "lunch", "snack", "dinner"]
        else:
            meal_types = ["breakfast", "snack", "lunch", "snack", "dinner"][:num_meals]
        
        # Add image bonus to scoring
        suitable_recipes['has_image'] = suitable_recipes['Images'].apply(
            lambda x: 1 if (isinstance(x, str) and 'https://' in x and len(x) > 50) else 0
        )
        
        # Goal-based nutritional priorities
        if goal == "weight_loss":
            # Prioritize high protein, high fiber, lower calorie density
            suitable_recipes['score'] = (
                suitable_recipes['ProteinContent'] * 2 +
                (suitable_recipes['ProteinContent'] / suitable_recipes['Calories']) * 100 -
                suitable_recipes['Calories'] * 0.01 +
                suitable_recipes['has_image'] * 50  # Bonus for having image
            )
        elif goal == "muscle_gain":
            # Prioritize high protein, moderate carbs
            suitable_recipes['score'] = (
                suitable_recipes['ProteinContent'] * 3 +
                suitable_recipes['CarbohydrateContent'] * 1.5 +
                suitable_recipes['Calories'] * 0.01 +
                suitable_recipes['has_image'] * 50  # Bonus for having image
            )
        else:
            # Balanced approach
            suitable_recipes['score'] = (
                suitable_recipes['ProteinContent'] * 1.5 +
                suitable_recipes['CarbohydrateContent'] * 1 +
                suitable_recipes['FatContent'] * 1 +
                suitable_recipes['has_image'] * 50  # Bonus for having image
            )
        
        # Enhanced shuffling for better variety across days
        if day_seed > 0:
            # Multiple randomization passes for better variety
            np.random.seed(day_seed * 42 + 17)
            suitable_recipes = suitable_recipes.sample(frac=1).reset_index(drop=True)
            
            # Second shuffle with different seed
            np.random.seed(day_seed * 73 + 29)
            suitable_recipes = suitable_recipes.sample(frac=1).reset_index(drop=True)
        
        # Create multiple offsets for better variety
        base_offset = (day_seed * 31) % len(suitable_recipes) if day_seed > 0 else 0
        secondary_offset = (day_seed * 47) % len(suitable_recipes) if day_seed > 0 else 0
        
        used_recipe_ids = set()
        
        for meal_num in range(num_meals):
            # Create highly varied offset for each meal and day
            meal_offset = (base_offset + meal_num * 41 + secondary_offset + day_seed * 19) % len(suitable_recipes)
            
            # Get available recipes that haven't been used
            available_recipes = suitable_recipes.copy()
            if used_recipe_ids:
                available_recipes = available_recipes[~available_recipes.index.isin(used_recipe_ids)]
            
            # If we've used too many recipes, reset but skip the most recent ones
            if len(available_recipes) < 10:
                available_recipes = suitable_recipes.copy()
                if len(used_recipe_ids) > 0:
                    recent_ids = list(used_recipe_ids)[-min(5, len(used_recipe_ids)):]
                    available_recipes = available_recipes[~available_recipes.index.isin(recent_ids)]
            
            # Apply meal-specific offset with better distribution
            if len(available_recipes) > meal_offset:
                start_idx = meal_offset
                slice_size = min(20, len(available_recipes) // 2)
                available_recipes = available_recipes.iloc[start_idx:start_idx + slice_size]
                if len(available_recipes) == 0:
                    available_recipes = suitable_recipes.iloc[:slice_size]
            
            # Select best recipe from available slice
            if len(available_recipes) > 0:
                recipe = available_recipes.nlargest(1, 'score').iloc[0]
                used_recipe_ids.add(recipe.name)
                
                # Calculate nutritional density scores
                protein_density = recipe['ProteinContent'] / recipe['Calories'] * 100 if recipe['Calories'] > 0 else 0
                nutrient_score = min(5.0, max(3.0, protein_density * 0.2 + 3.5))
                
                recipe_dict = {
                    "recipe_id": str(recipe.name),
                    "name": recipe['Name'],
                    "category": "main_course",
                    "calories": int(recipe['Calories']),
                    "protein": int(recipe['ProteinContent']),
                    "carbs": int(recipe['CarbohydrateContent']),
                    "fat": int(recipe['FatContent']),
                    "instructions": recipe['RecipeInstructions'],
                    "ingredients": recipe['RecipeIngredientParts'],
                    "rating": float(recipe.get('AggregatedRating', nutrient_score)),
                    "image_url": recipe['Images'],
                    "meal_type": meal_types[meal_num],
                    "protein_density": round(protein_density, 1),
                    "goal_alignment": round(recipe['score'], 1)
                }
                
                selected_recipes.append(recipe_dict)
        
        print(f"Selected {len(selected_recipes)} recipes", file=sys.stderr)
        return selected_recipes
        
    except Exception as e:
        import traceback
        print(f"Error in select_recipes: {str(e)}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return []

app = Flask(__name__)
from flask_cors import CORS # This import was already there, but good to ensure it's visible
CORS(app, resources={
    r"/api/diet/recommend": { # Updated to match the client's expected path
        "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": True,
        "max_age": 3600
    }
})

# Updated route to match the client's request path
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
        
        # Load recipe dataset
        script_dir = os.path.dirname(os.path.abspath(__file__))
        csv_path = os.path.join(script_dir, 'dataset', 'recipes.csv')
        df = pd.read_csv(csv_path, low_memory=False)
        
        # Select appropriate recipes with goal optimization
        meal_count = int(data.get('meal_count', 3))
        day_seed = data.get('day_seed', 0)
        print(f"Processing request with day_seed: {day_seed}, Goal: {goal}, Daily calories: {targets['daily_calories']}", file=sys.stderr)
        meal_recommendations = select_recipes(df, targets['daily_calories'], meal_count, goal, data, day_seed)
        
        # Debug image URLs and meal variety
        for i, meal in enumerate(meal_recommendations):
            print(f"Meal {i+1}: {meal['name']}, Image: {meal.get('image_url', 'No image')[:50]}{'...' if len(meal.get('image_url', '')) > 50 else ''}", file=sys.stderr)
        
        # Enhanced response with detailed analytics
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
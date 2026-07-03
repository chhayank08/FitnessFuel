import json
import sys
import random
from typing import Dict, List

def parse_workout_data():
    """Parse workout dataset and extract exercise patterns"""
    exercises = {
        'cardio': ['Running', 'Cycling', 'Walking', 'Jumping Jacks', 'High Knees', 'Jump Rope', 'Burpees'],
        'strength': ['Bench Press', 'Deadlifts', 'Squats', 'Pull-ups', 'Push-ups', 'Dumbbell Rows', 'Shoulder Press'],
        'core': ['Russian Twists', 'Planks', 'Sit-ups', 'Mountain Climbers'],
        'functional': ['Kettlebell Swings', 'Lunges', 'Leg Press', 'Tricep Dips', 'Bicep Curls', 'Bodyweight Squats']
    }
    return exercises

def calculate_exercise_intensity(user_data: dict) -> str:
    """Calculate exercise intensity based on user profile"""
    age = int(user_data.get('age', 30))
    fitness_level = user_data.get('fitness_level', 'beginner').lower()
    goal = user_data.get('goal', 'maintain').lower()
    
    # Adjust intensity based on age
    if age > 50:
        base_intensity = 'low'
    elif age > 35:
        base_intensity = 'moderate'
    else:
        base_intensity = 'high'
    
    # Adjust based on fitness level
    intensity_map = {
        'beginner': 'low',
        'intermediate': 'moderate', 
        'advanced': 'high'
    }
    
    fitness_intensity = intensity_map.get(fitness_level, 'moderate')
    
    # Final intensity (take the lower of the two)
    if base_intensity == 'low' or fitness_intensity == 'low':
        return 'low'
    elif base_intensity == 'moderate' or fitness_intensity == 'moderate':
        return 'moderate'
    else:
        return 'high'

def generate_workout_plan(user_data: dict) -> List[Dict]:
    """Generate a 7-day workout plan based on user profile"""
    exercises = parse_workout_data()
    intensity = calculate_exercise_intensity(user_data)
    goal = user_data.get('goal', 'maintain').lower()
    
    # Set parameters based on intensity and goal
    intensity_params = {
        'low': {'sets': [2, 3], 'reps': [8, 12], 'exercises_per_day': 3},
        'moderate': {'sets': [3, 4], 'reps': [10, 15], 'exercises_per_day': 4},
        'high': {'sets': [3, 5], 'reps': [12, 20], 'exercises_per_day': 5}
    }
    
    params = intensity_params[intensity]
    
    # Exercise distribution based on goal
    goal_distribution = {
        'weight_loss': {'cardio': 0.4, 'strength': 0.3, 'core': 0.2, 'functional': 0.1},
        'muscle_gain': {'cardio': 0.2, 'strength': 0.5, 'core': 0.1, 'functional': 0.2},
        'maintain': {'cardio': 0.3, 'strength': 0.3, 'core': 0.2, 'functional': 0.2},
        'endurance': {'cardio': 0.5, 'strength': 0.2, 'core': 0.2, 'functional': 0.1}
    }
    
    distribution = goal_distribution.get(goal, goal_distribution['maintain'])
    
    workout_plan = []
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    
    for i, day in enumerate(days):
        if i == 2 or i == 5:  # Wednesday and Saturday - Rest days
            workout_plan.append({
                'day': day,
                'type': 'rest',
                'exercises': [],
                'notes': 'Rest day - light stretching or walking recommended'
            })
            continue
        
        day_exercises = []
        exercises_count = params['exercises_per_day']
        
        # Select exercises based on distribution
        for category, ratio in distribution.items():
            count = max(1, int(exercises_count * ratio))
            selected = random.sample(exercises[category], min(count, len(exercises[category])))
            
            for exercise in selected:
                sets = random.choice(params['sets'])
                reps = random.randint(params['reps'][0], params['reps'][1])
                
                day_exercises.append({
                    'name': exercise,
                    'category': category,
                    'sets': sets,
                    'reps': reps,
                    'rest_seconds': 60 if category == 'strength' else 45
                })
        
        # Limit to target number of exercises
        day_exercises = day_exercises[:exercises_count]
        
        workout_plan.append({
            'day': day,
            'type': 'workout',
            'exercises': day_exercises,
            'estimated_duration': len(day_exercises) * 8 + 10  # minutes
        })
    
    return workout_plan

def main():
    try:
        # Read user data from stdin
        input_data = sys.stdin.read()
        user_data = json.loads(input_data)
        
        # Generate workout plan
        workout_plan = generate_workout_plan(user_data)
        
        # Return the plan
        response = {
            'workout_plan': workout_plan,
            'intensity': calculate_exercise_intensity(user_data),
            'goal': user_data.get('goal', 'maintain'),
            'duration_weeks': 4,
            'notes': 'This is a personalized 7-day workout plan. Adjust weights and intensity as needed.'
        }
        
        print(json.dumps(response))
        
    except Exception as e:
        error_response = {
            'error': str(e),
            'workout_plan': [],
            'intensity': 'moderate',
            'goal': 'maintain'
        }
        print(json.dumps(error_response))

if __name__ == '__main__':
    main()
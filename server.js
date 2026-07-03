import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Exercise recommendation endpoint
app.post('/api/exercise/recommend', async (req, res) => {
  try {
    const userProfile = req.body;
    
    // Spawn Python process
    const pythonProcess = spawn('python3', [
      join(__dirname, 'exercise_service_wrapper.py')
    ]);

    let dataString = '';
    let errorString = '';

    // Collect data from script
    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    // Collect any errors
    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
    });

    // Handle process completion
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python script error:', errorString);
        return res.status(500).json({ 
          error: 'Error processing exercise recommendations',
          details: errorString
        });
      }
      
      try {
        const recommendations = JSON.parse(dataString);
        res.json(recommendations);
      } catch (parseError) {
        console.error('Error parsing Python output:', parseError);
        res.status(500).json({ 
          error: 'Error processing exercise recommendations',
          details: 'Invalid output format'
        });
      }
    });

    // Send user profile data to Python script
    pythonProcess.stdin.write(JSON.stringify(userProfile));
    pythonProcess.stdin.end();

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Diet recommendation endpoint
app.post('/api/diet/recommend', async (req, res) => {
  try {
    const userProfile = req.body;
    
    // Spawn Python process
    const pythonProcess = spawn('python3', [
      join(__dirname, 'simple_diet_service.py')
    ]);

    let dataString = '';
    let errorString = '';

    // Collect data from script
    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    // Collect any errors
    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
    });

    // Handle process completion
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python script error:', errorString);
        return res.status(500).json({ 
          error: 'Error processing diet recommendations',
          details: errorString
        });
      }
      
      try {
        const recommendations = JSON.parse(dataString);
        res.json(recommendations);
      } catch (parseError) {
        console.error('Error parsing Python output:', parseError);
        res.status(500).json({ 
          error: 'Error processing diet recommendations',
          details: 'Invalid output format'
        });
      }
    });

    // Send user profile data to Python script
    pythonProcess.stdin.write(JSON.stringify(userProfile));
    pythonProcess.stdin.end();

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
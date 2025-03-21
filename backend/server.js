require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const projectRoute = require('./routes/project');

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

const mongoURI = process.env.MONGO_URI;
if (!mongoURI) throw new Error('MONGO_URI is not defined in .env');
mongoose
  .connect(mongoURI)
  .then(() => {
    if (process.env.NODE_ENV !== 'test') {
      console.log('MongoDB connected');
    }
  })
  .catch((err) => console.log(err));

app.use(('/api/projects', projectRoute));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

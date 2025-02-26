// server.js - Simple Node.js tracking server
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
require('dotenv').config();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

// Email Schema
const emailSchema = new mongoose.Schema({
  emailId: {
    type: String,
    required: true,
    unique: true
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  opened: {
    type: Boolean,
    default: false
  },
  firstOpenedAt: Date,
  opens: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String
  }]
});

const Email = mongoose.model('Email', emailSchema);

// Routes

// Track email open
app.get('/track/:emailId', async (req, res) => {
  const { emailId } = req.params;
  const ipAddress = req.ip;
  const userAgent = req.headers['user-agent'];
  
  try {
    // Find the email
    const email = await Email.findOne({ emailId });
    
    if (!email) {
      // Create new email record if it doesn't exist
      const newEmail = new Email({
        emailId,
        opened: true,
        firstOpenedAt: new Date(),
        opens: [{
          timestamp: new Date(),
          ipAddress,
          userAgent
        }]
      });
      
      await newEmail.save();
    } else {
      // Update existing email
      if (!email.opened) {
        email.opened = true;
        email.firstOpenedAt = new Date();
      }
      
      // Add new open event
      email.opens.push({
        timestamp: new Date(),
        ipAddress,
        userAgent
      });
      
      await email.save();
    }
    
    // Return a 1x1 transparent GIF
    const transparentGif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.set('Content-Type', 'image/gif');
    res.send(transparentGif);
    
  } catch (error) {
    console.error('Error tracking email open:', error);
    
    // Still return the transparent GIF to avoid errors in email clients
    const transparentGif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.set('Content-Type', 'image/gif');
    res.send(transparentGif);
  }
});

// Register a new email
app.post('/api/register', async (req, res) => {
  const { emailId } = req.body;
  
  try {
    const newEmail = new Email({
      emailId,
      opened: false
    });
    
    await newEmail.save();
    res.status(201).json({ success: true, emailId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check email status
app.get('/api/status/:emailId', async (req, res) => {
  const { emailId } = req.params;
  
  try {
    const email = await Email.findOne({ emailId });
    
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }
    
    res.json({
      emailId: email.emailId,
      opened: email.opened,
      openedAt: email.firstOpenedAt,
      openCount: email.opens.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get detailed open information
app.get('/api/opens/:emailId', async (req, res) => {
  const { emailId } = req.params;
  
  try {
    const email = await Email.findOne({ emailId });
    
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }
    
    res.json({
      emailId: email.emailId,
      opens: email.opens
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Email tracking server running on port ${port}`);
});
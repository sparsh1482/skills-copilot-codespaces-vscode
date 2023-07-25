// Create web server using express
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { randomBytes } = require('crypto'); // Create random id
const axios = require('axios');

// Create express app
const app = express();
app.use(bodyParser.json());
app.use(cors());

// Create comments object
const commentsByPostId = {};

// Create route to get comments
app.get('/posts/:id/comments', (req, res) => {
  // Return comments for post id
  res.send(commentsByPostId[req.params.id] || []);
});

// Create route to add comments
app.post('/posts/:id/comments', async (req, res) => {
  // Generate random id
  const commentId = randomBytes(4).toString('hex');
  // Get content from request body
  const { content } = req.body;
  // Get comments for post id
  const comments = commentsByPostId[req.params.id] || [];
  // Add new comment to comments object
  comments.push({ id: commentId, content, status: 'pending' });
  // Add comments to comments object
  commentsByPostId[req.params.id] = comments;
  // Create event to send to event bus
  await axios.post('http://localhost:4005/events', {
    type: 'CommentCreated',
    data: {
      id: commentId,
      content,
      postId: req.params.id,
      status: 'pending',
    },
  });
  // Return comments for post id
  res.status(201).send(comments);
});

// Create route to handle events
app.post('/events', async (req, res) => {
  // Get event type
  const { type, data } = req.body;
  // Check event type
  if (type === 'CommentModerated') {
    // Get comment id and status
    const { id, postId, status, content } = data;
    // Get comments for post id
    const comments = commentsByPostId[postId];
    // Get comment by id
    const comment = comments.find((comment) => comment.id === id);
    // Update comment status
    comment.status = status;
    // Create event to send to event bus
    await axios.post('http://localhost:4005/events', {
      type: 'CommentUpdated',
      data: {
    
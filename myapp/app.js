var express = require('express');
var app = express();
const bodyParser = require('body-parser');
const { Pool } = require('pg'); 
const session = require('express-session');

// set the view engine to ejs
app.set('view engine', 'ejs');

// Middleware to parse URL-encoded bodies (form submissions)
app.use(bodyParser.urlencoded({ extended: true }));

// use the css file box-style
app.use(express.static('public'));

app.use(express.json());

app.use(session({
  secret: 'your_secret_key', 
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } 
}));

// array for blogs and id
blogposts = [];
idCount = 0;

// index page
app.get('/', function(req, res) {
  const user = req.session.user || null;
  res.render('pages/index', {
    user: user
  });
});

app.post('/reload', (req, res) => {
  const { user_id, name } = req.body;

  req.session.user  =
  {
    name : name,
    id : user_id
  }
  
  // You can perform any necessary actions here, such as updating user sessions, etc.
  res.redirect('/');
});

// Create a pool instance to connect to your database
const pool = new Pool({
  user: 'chas', // your PostgreSQL user
  host: 'localhost',     // your database host
  database: 'blogdb',    // your database name
  password: 'password', // your database password
  port: 5432,            // your database port
});


// get the user post
app.post('/blog/add',function(req,res){

  const { title, body } = req.body;


  var user = {
    name : req.body.name,
    id : req.body.id
  }

  if (!user.id || !user.name) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  // add blogpost to sql
  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required.' });
  }

  try {
    const creatorName = req.body.name;

    // Insert the blog post into the database
    const query = `
        INSERT INTO blogs (creator_name, creator_user_id, title, body, date_created) 
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING blog_id
    `;
    const values = [creatorName, user.id, title, body];

    const result = pool.query(query, values);

    console.log(result);
  } catch (err) {
      console.error('Error adding blog post:', err);
      res.status(500).json({ error: 'Failed to add blog post' });
  }


  res.render('pages/index', {
    user: user
  });
   
});



// delete a blogpost from the array based on id
app.post('/blog/delete', async (req, res) => 
{
  const { id, user } = req.body;
  console.log(id,user);


  try {
    const result = await pool.query('DELETE FROM blogs WHERE blog_id = $1', [id]);

    if (result.rowCount > 0) {
      res.render('pages/index', {
        user: user
      });
    } else {
      res.json({ success: false, message: 'Post not found.' });
    }
  } catch (err) {
    console.error('Error deleting post:', err);
    res.status(500).json({ success: false, message: 'Failed to delete post.' });
  }
});


// Route to handle the edit form submission
app.post('/blog/edit', async (req, res) => { 
  console.log(req.body);
  var {id, title, body} = req.body;

  var user = {
    id : req.body.user_id,
    name : req.body.name
  }
  console.log(user);

  const updates = [];
  const values = [];

  // Add title to the update query if it's provided
  if (title) {
    updates.push(`title = $${updates.length + 1}`); 
    values.push(title); 
  }

  // Add comment to the update query if it's provided
  if (body) {
    updates.push(`body = $${updates.length + 1}`); 
    values.push(body); 
  }

  values.push(id); 

  // Prepare the query
  const query = `
    UPDATE blogs
    SET ${updates.join(', ')}
    WHERE blog_id = $${values.length}
  `;


  try {
      // Execute the update query
      const result = await pool.query(query, values);
      console.log(result);

      // Redirect or respond as needed
      res.render('pages/index', {
        user: user
      });
    } catch (err) {
      console.error('Error updating blog post:', err);
      res.status(500).json({ error: 'Failed to update blog post' });
    }
});

// Route for Sign Up page
app.get('/pages/signup', (req, res) => {
  return res.render('pages/signup', {
    message: ""
  });
});

// Route for Sign In page
app.get('/pages/signin', (req, res) => {
  return res.render('pages/signin', {
    message: ""
  });
});

// all user 
// get the user post
app.post('/user/add',function(req,res){


  creationTime = new Date();

  var user = {
      id : req.body.id,
      name : req.body.name
  }

  var password = req.body.password;

  console.log(user);
  if(!checkUserExists(user.id))
  {
    return res.render('pages/signup', {
      message: "user id already exists"
    });
  }

  // add user to database
  try {
    // Insert user into the 'users' table
    const query = 'INSERT INTO users (user_id, password, name) VALUES ($1, $2, $3)';
    const values = [user.id, password, user.name];

    const result =  pool.query(query, values);

    // Send a response back to the client
    console.log(result);
    res.render('pages/index', {
      user: user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add user' });
  }
   
});


// Route to get blog posts
app.get('/api/blog', async (req, res) => {
  try {
      const result = await pool.query('SELECT * FROM blogs ORDER BY created_at DESC'); 
      const blogposts = result.rows; 
      
      // Render your blog view, passing the blogposts
      //console.log(blogposts);
      res.json(blogposts);
  } catch (err) {
      console.error('Error fetching blog posts:', err);
      res.status(500).send('Internal Server Error');
  }
});


// signin user
app.post('/user/signin',function(req,res){


  var user = {
      id : req.body.id,
      name : req.body.name
  }

  console.log(user);

  if(checkUserAuth(user.id,req.body.password,user.name))
  {
    return res.render('pages/index', {
      user: user
    });
  }
  else
  {
    return res.render('pages/signin', {
      message: "incorrect information"
    });
  }

   
});



// check if user exits
async function checkUserExists(userId) {
  try {
      const query = 'SELECT * FROM users WHERE user_id = $1';
      const values = [userId];

      const res = await pool.query(query, values);

      // If the result row count is greater than 0, the user exists
      if (res.rows.length > 0) {
          console.log('User exists:', res.rows[0]);
          return true; // User exists
      } else {
          console.log('User does not exist.');
          return false; // User does not exist
      }
  } catch (err) {
      console.error('Error checking user existence:', err);
      throw err; // Handle or log the error as necessary
  }
}


// check if user is correct
async function checkUserAuth(userId, userPassword, name) {
  try {
    // Query to select user by user_id, password, and name
    const query = 'SELECT * FROM users WHERE user_id = $1 AND password = $2 AND name = $3';
    const values = [userId, userPassword, name];

    const res = await pool.query(query, values);

    // If the result row count is greater than 0, the user exists and credentials match
    if (res.rows.length > 0) {
        console.log('User exists and credentials match:', res.rows[0]);
        return true; // User exists and credentials match
    } else {
        console.log('User does not exist or credentials do not match.');
        return false; // User does not exist or credentials do not match
    }
  } catch (err) {
      console.error('Error checking user authentication:', err);
      throw err; // Handle or log the error as necessary
  }
}

app.listen(5000);
console.log('Server is listening on port 5000');
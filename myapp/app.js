var express = require('express');
var app = express();
const bodyParser = require('body-parser');

// set the view engine to ejs
app.set('view engine', 'ejs');

// Middleware to parse URL-encoded bodies (form submissions)
app.use(bodyParser.urlencoded({ extended: true }));

// use the css file box-style
app.use(express.static('public'));

// array for blogs and id
blogposts = [];
idCount = 0;

// index page
app.get('/', function(req, res) {
  res.render('pages/index', {
  });
});


// get the user post
app.post('/blog/add',function(req,res){

  creationTime = new Date();

  var blogpost = {
      name : req.body.fname,
      title : req.body.title,
      comment : req.body.comment
  }

  blogpost.time = creationTime;
  blogpost.id = idCount + 1;

  console.log(blogpost);

  blogposts.push(blogpost);

  res.render('pages/index', {
    blogposts: blogposts
  });
   
});


// delete a blogpost from the array based on id
app.post('/blog/delete', function(req, res)
{
  var postid = req.body.id;
  for(let i = 0; i < blogposts.length; i++)
  {
    if(blogposts[i].id ==  postid)
    {
      blogposts.splice(i, 1);
      break;
    }
  }
  res.render('pages/index', {
    blogposts: blogposts
  });
});


// Route to handle the edit form submission
app.post('/blog/edit', (req, res) => {

  var {id, title, name, comment} = req.body;

  for(let i = 0; i < blogposts.length; i++)
    {
      if(blogposts[i].id ==  id)
      {
        blogposts[i].title = title;
        blogposts[i].name = name;
        blogposts[i].comment = comment;
        break;
      }
    }

  res.render('pages/index', {
    blogposts: blogposts
  });
});

app.listen(8080);
console.log('Server is listening on port 8080');
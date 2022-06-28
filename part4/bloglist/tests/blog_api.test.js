const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)

const Blog = require('../models/blog')

beforeEach(async () => {
  await Blog.deleteMany({})

  for (let blog of helper.initialBlogs) {
    let blogObject = new Blog(blog)
    await blogObject.save()
  }
})

test('blog posts are returned in the JSON format', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('unique identifier is named "id"', async () => {
  const response = await api.get('/api/blogs')

  response.body.forEach(blog => {
    expect(blog.id).toBeDefined()
  })
})

test('blogs can be created with POST request', async () => {
  const newBlog = {
    title: "blog added from the test",
    author: "default author",
    url: "https://example.com/",
    likes: 2
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const blogsAtEnd = await helper.blogsInDb()
  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

  const titles = blogsAtEnd.map(blog => blog.title)
  expect(titles).toContain('blog added from the test')
})

test('missing likes results in 0', async () => {
  const newBlog = {
    title: "blog with missing likes",
    author: "default author",
    url: "https://example.com/"
  }

  await api
    .post('/api/blogs')
    .send(newBlog)

  const blogsAtEnd = await helper.blogsInDb()
  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

  const indexOfTest = blogsAtEnd.findIndex(blog => blog.title === 'blog with missing likes')
  expect(blogsAtEnd[indexOfTest].likes).toEqual(0)
})

test('400 Bad Request response to missing title and/or url', async () => {
  let newBlog = {
    author: "default author"
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(400)

  newBlog = {
    author: "default author",
    url: "https://example.com/"
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(400)

  newBlog = {
    title: "blog with no url",
    author: "default author"
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(400)
})

afterAll(() => {
  mongoose.connection.close()
})
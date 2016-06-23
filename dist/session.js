document.addEventListener('DOMContentLoaded', function (event) {
  'use strict'

  var hinameEl = document.querySelector('h1#hiname')
  var logoutEl = document.querySelector('form#logout')
  var loginEl = document.querySelector('form#login')
  var registerEl = document.querySelector('form#register')

  var httpJSON = function (method, u, o) {
    var it = {
      method: method,
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }
    if (o) { it.body = JSON.stringify(o) }
    // console.log('it:', it)
    return fetch(u, it)
      .then(function (response) { return method === 'PUT' ? response : response.json() })
  }

  var postJSON = httpJSON.bind(this, 'POST')
  var putJSON = httpJSON.bind(this, 'PUT')
  var getJSON = httpJSON.bind(this, 'GET')
  var deleteJSON = httpJSON.bind(this, 'DELETE')

  var formToJSON = function (el) {
    var pair
    var obj = { }
    var fd = new FormData(el)

    for (pair of fd.entries()) { obj[pair[0]] = pair[1] }
    return obj
  }

  var setup = function (userCtx) {
    if (userCtx.name) {
      console.log('logged in')
      logoutEl.parentNode.className = 'visibleForm'
      loginEl.parentNode.className = 'hiddenForm'
      registerEl.parentNode.className = 'hiddenForm'
      hinameEl.innerHTML = 'Hi ' + userCtx.name
    } else {
      console.log('not logged in')
      logoutEl.parentNode.className = 'hiddenForm'
      loginEl.parentNode.className = 'visibleForm'
      registerEl.parentNode.className = 'visibleForm'
      hinameEl.innerHTML = 'Hi'
    }
  }

  console.log('ready')

  // are we logged in?
  getJSON('/api/_session')
    .then(function (json) {
      console.log('parsed json', json.userCtx)
      // simplest: json.userCtx.name is truthy
      // more involved: json.userCtx.roles.indexOf('NEEDED_ROLE_FOR_APP') !== -1
      setup(json.userCtx)
    })

  logoutEl.addEventListener('submit', function (event) {
    event.preventDefault()
    deleteJSON('/api/_session')
      .then(function (response) {
        console.log('LOGOUT response:', response)
        setup(response)
      })
  })

  loginEl.addEventListener('submit', function (event) {
    var obj = formToJSON(this)
    event.preventDefault()
    console.log('form obj:', obj)
    if (!obj.name || !obj.password) {
      console.log('missing fields')
      return
    }
    postJSON('/api/_session', obj)
      .then(function (response) {
        console.log('LOGIN response:', response)
        setup(response)
      })
  })

  registerEl.addEventListener('submit', function (event) {
    var obj = formToJSON(this)
    event.preventDefault()
    console.log('form obj:', obj)
    if (!obj.name || !obj.email || !obj.password || !obj.passwordBis) {
      console.log('missing fields')
      return
    }
    if (obj.password !== obj.passwordBis) {
      console.log('passwords don\'t match')
      return
    }
    delete obj.passwordBis
    obj.roles =  []
    obj.type = 'user'

    // we should first check that the email is not already in use
    // let's create the user!
    putJSON('/api/_users/org.couchdb.user:' + obj.name , obj)
      .then(function (response) {
        console.log('response:', response)
        switch (response.status) {
          case 201:
            // created
            console.log(response.statusText, obj.name)
            postJSON('/api/_session', { name: obj.name, password: obj.password })
              .then(function (response) {
                console.log('LOGIN response:', response)
                setup(response)
              })
            break;

          case 409:
            // name is already taken
            console.log(response.statusText, obj.name)
            break;

          default:
            console.log('unexpected response:', response.status, response.statusText, obj.name)
        }
      })
  })
})

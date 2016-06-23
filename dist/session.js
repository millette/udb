document.addEventListener('DOMContentLoaded', function (event) {
  'use strict'

  var hinameEl = document.querySelector('#hiname')
  var logoutEl = document.querySelector('#logout')
  var loginEl = document.querySelector('#login')
  var registerEl = document.querySelector('#register')
  var profileEl = document.querySelector('#profile')
  var profileinfoEl = document.querySelector('#profileinfo')

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
      if (profileEl) { profileEl.parentNode.className = 'visibleForm' }
      if (logoutEl) { logoutEl.parentNode.className = 'visibleForm' }
      if (loginEl) { loginEl.parentNode.className = 'hiddenForm' }
      if (registerEl) { registerEl.parentNode.className = 'hiddenForm' }
      getJSON('/api/_users/org.couchdb.user:' + userCtx.name)
        .then(function (json) {
          var preEl = document.createElement('pre')
          var hash = location.hash.slice(1) || false
          // console.log('old hash:', json.hash || false)
          if (hash && json.hash !== hash) {
            // console.log('new hash:', hash)
            json.hash = hash
            putJSON('/api/_users/org.couchdb.user:' + json.name, json)
              .then(function (response) {
                console.log('response #3:', response)
                // TODO show update confirmation to the user
              })
          }

          console.log('parsed json#2', json)
          if (hinameEl) {
            hinameEl.innerHTML = 'Hi ' + userCtx.name + ' (' + json.email + ')'
          }
          preEl.innerHTML = JSON.stringify(json, null, ' ')
          if (profileinfoEl) {
            profileinfoEl.innerHTML = ''
            profileinfoEl.appendChild(preEl)
          }
        })
    } else {
      console.log('not logged in')
      if (profileEl) { profileEl.parentNode.className = 'hiddenForm' }
      if (logoutEl) { logoutEl.parentNode.className = 'hiddenForm' }
      if (loginEl) { loginEl.parentNode.className = 'visibleForm' }
      if (registerEl) { registerEl.parentNode.className = 'visibleForm' }
      if (hinameEl) { hinameEl.innerHTML = 'Hi' }
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

  logoutEl && logoutEl.addEventListener('submit', function (event) {
    event.preventDefault()
    deleteJSON('/api/_session')
      .then(function (response) {
        console.log('LOGOUT response:', response)
        setup(response)
        // TODO show logout confirmation to the user
      })
  })

  loginEl && loginEl.addEventListener('submit', function (event) {
    var obj = formToJSON(this)
    event.preventDefault()
    console.log('form obj:', obj)
    if (!obj.name || !obj.password) {
      console.log('missing fields')
      // TODO show message to the user
      return
    }
    postJSON('/api/_session', obj)
      .then(function (response) {
        console.log('LOGIN response:', response)
        setup(response)
        // TODO show login confirmation to the user
      })
  })

  registerEl && registerEl.addEventListener('submit', function (event) {
    var obj = formToJSON(this)
    event.preventDefault()
    console.log('form obj:', obj)
    if (!obj.name || !obj.email || !obj.password || !obj.passwordBis) {
      console.log('missing fields')
      // TODO show message to the user
      return
    }
    if (obj.password !== obj.passwordBis) {
      console.log('passwords don\'t match')
      // TODO show message to the user
      return
    }
    delete obj.passwordBis
    obj.roles =  []
    obj.type = 'user'

    // TODO we should first check that the email is not already in use
    // For now, let's try to create the user anyway
    putJSON('/api/_users/org.couchdb.user:' + obj.name, obj)
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
                // TODO show login confirmation to the user
              })
            break;

          case 409:
            // name is already taken
            console.log(response.statusText, obj.name)
            // TODO show message to the user
            break;

          default:
            console.log('unexpected response:', response.status, response.statusText, obj.name)
        }
      })
  })
})

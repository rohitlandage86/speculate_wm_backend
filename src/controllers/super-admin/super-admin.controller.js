const pool = require('../../../db')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
//error handle 422...
error422 = (message, res) => {
  return res.status(422).json({
    status: 422,
    message: message
  })
}
//error handle 500...
error500 = (error, res) => {
  console.log(error)
  return res.status(500).json({
    status: 500,
    message: 'Internal Server Error',
    error: error
  })
}
//create super admin
const createSuperAdmin = async (req, res) => {
  const user_name = req.body.user_name ? req.body.user_name.trim() : ''
  const email_id = req.body.email_id ? req.body.email_id.trim() : ''
  const password = req.body.password ? req.body.password.trim() : ''

  if (!user_name) {
    return error422('User name is required.', res)
  } else if (!email_id) {
    return error422('Email id is required.', res)
  } else if (!password) {
    return error422('Password is required.', res)
  }

  let connection
  try {
    connection = await pool.connect()

    // Check if Email ID already exists
    const checkEmailQuery =
      'SELECT * FROM untitled WHERE TRIM(LOWER(email_id)) = $1'
    const checkEmailResult = await connection.query(checkEmailQuery, [
      email_id.toLowerCase()
    ])

    if (checkEmailResult.rowCount > 0) {
      return error422('Email id is already exist.', res)
    }

    // Insert into untitled table
    const query =
      'INSERT INTO untitled (user_name, email_id, user_type_id) VALUES ($1, $2, $3) RETURNING untitled_id'
    const result = await connection.query(query, [user_name, email_id, 1])
    const untitled_id = result.rows[0].untitled_id

    // Hash the password
    const hash = await bcrypt.hash(password, 10)

    // Insert into contrasena table
    const contrasenaQuery =
      'INSERT INTO contrasena (untitled_id, extenstions) VALUES ($1, $2)'
    await connection.query(contrasenaQuery, [untitled_id, hash])

    res.status(200).json({
      status: 200,
      message: 'Super Admin created successfully'
    })
  } catch (error) {
    return error500(error, res)
  } finally {
    if (connection) {
      connection.release()
    }
  }
}
//login super admin
const loginSuperAdmin = async (req, res) => {
  const email_id = req.body.email_id ? req.body.email_id.trim() : ''
  const password = req.body.password ? req.body.password.trim() : ''

  if (!email_id) {
    return error422('Email id is required.', res)
  } else if (!password) {
    return error422('Password is required.', res)
  }
  let connection
  try {
    connection = await pool.connect()
    //check email id is exist
    const query = 'SELECT * FROM untitled WHERE TRIM(LOWER(email_id)) = $1'
    const result = await connection.query(query, [email_id.toLowerCase()])
    const untitledData = result.rows[0]
    if (result.rowCount === 0) {
      return error422('Email id is Not Found.', res)
    }
    //get contrasena
    const contrasenaQuery = 'SELECT * FROM contrasena WHERE untitled_id = $1'
    const contrasenaResult = await connection.query(contrasenaQuery, [
      untitledData.untitled_id
    ])
    const hash = contrasenaResult.rows[0].extenstions
    //compare password
    const isValid = await bcrypt.compare(password, hash)
    if (!isValid) {
      return error422('Password worng.', res)
    }
    let userData = {}
    if (untitledData.user_type_id == 1) {
      userData = untitledData
    } else if (untitledData.user_type_id == 2||untitledData.user_type_id == 3) {
      // Check if organization user exists
      const checkOrgUserQuery =
        'SELECT * FROM organization_users WHERE org_uid = $1'
      const orgUserResult = await connection.query(checkOrgUserQuery, [untitledData.org_uid])
      if (orgUserResult.rowCount === 0) {
        return error422('Organization user is Not Found', res)
      }
      userData = orgUserResult.rows[0]
    } else if (untitledData.user_type_id == 4) {
      userData = {
        untitled_id: untitledData.untitled_id,
        email_id: untitledData.email_id
      }
    }

    // Generate a JWT token
    const token = jwt.sign(
      {
        untitled_id: untitledData.untitled_id,
        email_id: untitledData.email_id
      },
      'secret_this_should_be', // Use environment variable for secret key
      { expiresIn: '1h' }
    )
    return res.status(200).json({
      status: 200,
      message: 'Authentication successfully',
      token: token,
      // user_type_id:untitledData.user_type_id,
      // untitled_id:untitledData.untitled_id,
      tokenExpiresIn: 36000,
      data: userData
    })
  } catch (error) {
    return error500(error, res)
  }
}
module.exports = {
  createSuperAdmin,
  loginSuperAdmin
}

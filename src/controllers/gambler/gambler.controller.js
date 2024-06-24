const pool = require('../../../db')
const bcrypt = require('bcrypt')
// error 422 handler
error422 = (message, res) => {
    return res.status(422).json({
        status: 422,
        message: message
    })
}
// error 500 handler
error500 = (error, res) => {
    console.log(error)
    return res.status(500).json({
        status: 500,
        message: 'Internal Server Error',
        error: error
    })
}
// sign up gambler
const signUpGambler = async (req, res) => {
    const first_name = req.body.first_name ? req.body.first_name.trim() : ''
    const last_name = req.body.last_name ? req.body.last_name.trim() : ''
    const dob = req.body.dob ? req.body.dob : ''
    const mobile = req.body.mobile ? req.body.mobile : null
    const address = req.body.address ? req.body.address.trim() : ''
    const state_id = req.body.state_id ? req.body.state_id : null
    const terms_privacy_policy = req.body.terms_privacy_policy
        ? req.body.terms_privacy_policy
        : null
    const ip_address = req.body.ip_address ? req.body.ip_address : ''
    const device_info = req.body.device_info ? req.body.device_info : ''
    const location = req.body.location ? req.body.location : ''
    const platform = req.body.platform ? req.body.platform.trim() : ''
    const user_name = req.body.user_name ? req.body.user_name.trim() : ''
    const email_id = req.body.email_id ? req.body.email_id.trim() : ''

    if (!first_name) {
        return error422('First name is required.', res)
    } else if (!last_name) {
        return error422('Last name is required.', res)
    } else if (!dob) {
        return error422('DOB is required.', res)
    } else if (!mobile) {
        return error422('Mobile is required.', res)
    } else if (!address) {
        return error422('Address is required.', res)
    } else if (!state_id) {
        return error422('State is required.', res)
    } else if (!terms_privacy_policy | (terms_privacy_policy != 1)) {
        return error422('Terms privacy policy is required.', res)
    } else if (!ip_address) {
        return error422('IP Address is required.', res)
    } else if (!device_info) {
        return error422('Device info is required.', res)
    } else if (!location) {
        return error422('Location is required.', res)
    } else if (!platform) {
        return error422('Platform is required.', res)
    } else if (!email_id) {
        return error422("Email id is required.", res)
    } else if (!user_name) {
        return error422("User name is required.", res)
    }
    let connection
    try {
        connection = await pool.connect();
        // Start a transaction
        await connection.query('BEGIN')
        // Check if Email ID already exists
        const checkEmailQuery =
            'SELECT * FROM untitled WHERE TRIM(LOWER(email_id)) = $1'
        const checkEmailResult = await connection.query(checkEmailQuery, [
            email_id.toLowerCase()
        ])

        if (checkEmailResult.rowCount > 0) {
            return error422('Email id is already exist.', res)
        }
        // Check if Mobile already exists
        const checkMobileQuery =
            'SELECT * FROM gamblers WHERE mobile = $1'
        const checkMobileResult = await connection.query(checkMobileQuery, [
            mobile
        ])

        if (checkMobileResult.rowCount > 0) {
            return error422('Mobile is already exist.', res)
        }
        //insert into gamblers table
        const gamblerQuery =
            'INSERT INTO gamblers (first_name, last_name, dob, mobile, address, state_id, terms_privacy_policy, ip_address, device_info, location, platform) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING gambler_id '
        const gamblerResult = await connection.query(gamblerQuery, [
            first_name,
            last_name,
            dob,
            mobile,
            address,
            state_id,
            terms_privacy_policy,
            ip_address,
            device_info,
            location,
            platform
        ])
        //insert into untitled table
        const untitledQuery =
            'INSERT INTO untitled ( user_name, email_id, user_type_id, gambler_id) VALUES ($1, $2, $3, $4) RETURNING untitled_id '
        const untitledResult = await connection.query(untitledQuery, [
            user_name,
            email_id,
            4,
            gamblerResult.rows[0].gambler_id,
        ])
        let length = 8,
            charset =
                'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
            password = ''
        for (let i = 0, n = charset.length; i < length; ++i) {
            password += charset.charAt(Math.floor(Math.random() * n))
        }
        // Hash the password
        const hash = await bcrypt.hash(password, 10)

        //insert into contrasena table
        const contrasenaQuery =
            'INSERT INTO contrasena (untitled_id, extenstions) VALUES ($1, $2)'
        const contrasenaResult = await connection.query(contrasenaQuery, [
            untitledResult.rows[0].untitled_id,
            hash
        ])
        // Commit the transaction
        await connection.query('COMMIT')
        return res.status(200).json({
            status: 200,
            message: 'Sign up successfully '
        })
    } catch (error) {
        await connection.query('ROLLBACK')
        return error500(error, res)
    } finally {
        if (connection) connection.release()
    }
}
//get gambler list
const getGamblers = async (req, res)=>{
    const { page, perPage, key } = req.query
  let connection
  try {
    connection = await pool.connect()
    let query = 'SELECT * FROM gamblers'
    let countQuery = 'SELECT COUNT(*) AS total FROM gamblers'
    if (key) {
      const lowercaseKey = key.toLowerCase().trim()
      if (key === 'activated') {
        query += ' WHERE status = 1'
        countQuery += ' WHERE status = 1'
      } else if (key === 'deactivated') {
        query += ' WHERE status = 0'
        countQuery += ' WHERE status = 0'
      } else {
        query += ` WHERE LOWER(first_name) LIKE '%${lowercaseKey}%'`
        countQuery += ` WHERE LOWER(first_name) LIKE '%${lowercaseKey}%'`
      }
    }
    query += ' ORDER BY cts DESC'
    let total = 0
    // Apply pagination if both page and perPage are provided
    if (page && perPage) {
      const totalResult = await connection.query(countQuery)
      total = parseInt(totalResult.rows[0].total)

      const start = (page - 1) * perPage
      query += ` LIMIT '${perPage}' OFFSET '${start}'`
    }
    const result = await connection.query(query)
    const gamblers = result.rows
    const data = {
      status: 200,
      message: 'Gamblers retrieved successfully',
      data: gamblers
    }
    // Add pagination information if provided
    if (page && perPage) {
      data.pagination = {
        per_page: perPage,
        total: total,
        current_page: page,
        last_page: Math.ceil(total / perPage)
      }
    }
    return res.status(200).json(data)
  } catch (error) {
    error500(error, res)
  } finally {
    if (connection) await connection.release()
  }

}
//get gambler by id...
const getGambler = async (req, res) => {
    const gambler_id = req.params.id
  
    let connection
    try {
      connection = await pool.connect()
      let query = 'SELECT * FROM gamblers WHERE gambler_id = $1'
      const result = await connection.query(query, [gambler_id])
      if (result.rowCount === 0) {
        return error422('Gambler is Not Found', res)
      }
      const gambler = result.rows[0]
      const data = {
        status: 200,
        message: 'Gambler retrieved successfully',
        data: gambler
      }
      return res.status(200).json(data)
    } catch (error) {
      error500(error, res)
    } finally {
      if (connection) connection.release()
    }
  }

module.exports = {
    signUpGambler,
    getGamblers,
    getGambler
}

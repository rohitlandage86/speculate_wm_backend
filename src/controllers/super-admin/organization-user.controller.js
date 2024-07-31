const pool = require('../../../db')
const bcrypt = require('bcrypt')
// const jwt = require("jsonwebtoken");

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
//create organization User...
const createOrganizationUser = async (req, res) => {
  const org_id = req.body.org_id ? req.body.org_id : ''
  const user_name = req.body.user_name ? req.body.user_name.trim() : ''
  const email_id = req.body.email_id ? req.body.email_id.trim() : ''
  const user_type_id = req.body.user_type_id ? req.body.user_type_id : null
  const untitled_id = req.companyData.untitled_id

  if (!org_id) {
    return error422('Organization is required.', res)
  } else if (!user_name) {
    return error422('User Name is required.', res)
  } else if (!email_id) {
    return error422('Email id is required.', res)
  } else if (!user_type_id) {
    return error422('User type is required.', res)
  }
  let connection

  try {
    connection = await pool.connect()
    // Start a transaction
    await connection.query('BEGIN')

    //check is Email Id exist...
    const checkEmailQuery =
      'SELECT * FROM untitled WHERE TRIM(LOWER(email_id)) = $1'
    const checkEmailResult = await connection.query(checkEmailQuery, [
      email_id.toLowerCase()
    ])
    if (checkEmailResult.rowCount > 0) {
      await connection.query('ROLLBACK')
      return error422('Email id is already exist.', res)
    }

    //insert into organization user table
    const orgUserQuery =
      'INSERT INTO organization_users (user_name, email_id, user_type_id, org_id, untitled_id) VALUES($1, $2, $3, $4, $5) RETURNING org_uid '
    const orgUserResult = await connection.query(orgUserQuery, [
      user_name,
      email_id,
      user_type_id,
      org_id,
      untitled_id
    ])
    //insert into untitled table
    const untitledQuery =
      'INSERT INTO untitled ( user_name, email_id, user_type_id, org_uid) VALUES ($1, $2, $3, $4) RETURNING untitled_id '
    const untitledResult = await connection.query(untitledQuery, [
      user_name,
      email_id,
      user_type_id,
      orgUserResult.rows[0].org_uid
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
    res.status(200).json({
      status: 200,
      message: 'Organization User created successfully'
    })
  } catch (error) {
    await connection.query('ROLLBACK')
    return error500(error, res)
  } finally {
    if (connection)  connection.release()
  }
}
// get organization users...
const getOrganizationUsers = async (req, res) => {
  const { page, perPage } = req.query

  try {
    let query = `SELECT * FROM organization_users`
    let countQuery = ` SELECT COUNT(*) AS total FROM organization_users`
    query += ' ORDER BY cts DESC '
    let total = 0
    // Apply pagination if both page and perPage are provided
    if (page && perPage) {
      const totalResult = await pool.query(countQuery)
      total = parseInt(totalResult.rows[0].total)

      const start = (page - 1) * perPage
      query += ` LIMIT ${perPage} OFFSET ${start}`
    }

    const result = await pool.query(query)
    const organizations = result.rows
    const data = {
      status: 200,
      message: 'Organizations retrieved successfully',
      data: organizations
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
    return error500(error, res)
  }
}
// get organization user by id...
const getOrganizationUser = async (req, res) => {
  const org_uid = parseInt(req.params.id)
  if (!org_uid) {
    
  }
  let connection
  try {
    connection = await pool.connect()
    const query = 'SELECT * FROM organization_users WHERE org_uid = $1'
    const result = await connection.query(query, [org_uid])

    if (result.rowCount === 0) {
      return error422('Organization User is Not Found', res)
    }
    const organizationUser = result.rows[0]
    return res.status(200).json({
      status: 200,
      message: 'Organization user retrieved successfully.',
      data: organizationUser
    })
  } catch (error) {
    return error500(error, res)
  } finally {
    if (connection) {
      connection.release()
    }
  }
}

const updateOrganizationUser = async (req, res) => {
  const org_uid = parseInt(req.params.id)
  const org_id = req.body.org_id ? req.body.org_id : ''
  const user_name = req.body.user_name ? req.body.user_name.trim() : ''
  const email_id = req.body.email_id ? req.body.email_id.trim() : ''
  const user_type_id = req.body.user_type_id ? req.body.user_type_id : null
  const untitled_id = req.companyData.untitled_id

  if (!org_id) {
    return error422('Organization is required.', res)
  } else if (!user_name) {
    return error422('User Name is required.', res)
  } else if (!email_id) {
    return error422('Email id is required.', res)
  } else if (!user_type_id) {
    return error422('User type is required.', res)
  } else if (!org_uid) {
    return error422('Organization user id is required.', res)
  }

  let connection
  connection = await pool.connect()
  // Start a transaction
  await connection.query('BEGIN')
  // Check if organization user exists
  const checkOrgUserQuery =
    'SELECT * FROM organization_users WHERE org_uid = $1'
  const orgUserResult = await connection.query(checkOrgUserQuery, [org_uid])
  if (orgUserResult.rowCount === 0) {
    return error422('Organization user is Not Found', res)
  }

  //check is email id exist
  const checkEmailQuery =
    'SELECT * FROM untitled  WHERE TRIM(LOWER(email_id)) = $1 AND org_uid != $2'
  const checkEmailResult = await connection.query(checkEmailQuery, [
    email_id.toLowerCase(),
    org_uid
  ])
  if (checkEmailResult.rowCount > 0) {
    return error422('Email id is already exist.', res)
  }
  try {
    // Update the organization record with new data
    const updateQuery = `
          UPDATE organization_users
          SET user_name = $1, email_id = $2, org_id = $3, user_type_id = $4, untitled_id = $5
          WHERE org_uid = $6 `

    const updateResult = await connection.query(updateQuery, [
      user_name,
      email_id,
      org_id,
      user_type_id,
      untitled_id,
      org_uid
    ])
    const updateUntitledQuery = `
    UPDATE untitled 
    SET user_name = $1, email_id = $2, user_type_id = $3
    WHERE org_uid = $4
    `
    const updateUntitledResult = await connection.query(updateUntitledQuery, [
      user_name,
      email_id,
      user_type_id,
      org_uid
    ])
    // Commit the transaction
    await connection.query('COMMIT')
    return res.status(200).json({
      status: 200,
      message: 'Organization user updated successfully.'
    })
  } catch (error) {
    // Rollback the transaction
    await connection.query('ROLLBACK')
    return error500(error, res)
  } finally {
    connection.release()
  }
}
const signUpOrganizationUser = async (req, res) => {
  const {
    organization_name,
    industry_type_id,
    full_name,
    email_id,
    subscription_id,
    contact_number,
    sales_email_id,
    support_email_id,
    designation_id,
    password,
    logoBase64,
    logoName
  } = req.body

  if (!organization_name || !email_id) {
    return res.status(422).json({
      status: 422,
      message: 'Organization name and email id are required'
    })
  }

  try {
    // Start a transaction
    await pool.query('BEGIN')

    // Check if the organization name with the provided organization exists
    const organizationQuery =
      'SELECT * FROM organization WHERE TRIM(LOWER(organization_name)) = $1'
    const organizationResult = await pool.query(organizationQuery, [
      organization_name.trim().toLowerCase()
    ])
    if (organizationResult.rowCount !== 0) {
      return res.status(422).json({
        status: 422,
        message: 'Organization name already exists'
      })
    }

    // Check if the email_id with the provided organization exists
    const emailIdExistingQuery =
      'SELECT * FROM organization WHERE TRIM(LOWER(email_id)) = $1'
    const emailIdExistingResult = await pool.query(emailIdExistingQuery, [
      email_id.trim().toLowerCase()
    ])
    if (emailIdExistingResult.rowCount !== 0) {
      return res.status(422).json({
        status: 422,
        message: 'Email id already exists'
      })
    }

    // Generate logoFileName and logoFilePath if logo provided
    let logoFileName = ''
    let logoFilePath = ''
    if (logoName && logoBase64) {
      const timestamp = Date.now()
      const fileExtension = path.extname(logoName)
      logoFileName = `${organization_name}_${timestamp}${fileExtension}`
      logoFilePath = path.join(
        __dirname,
        '..',
        '..',
        '..',
        'images',
        'logo',
        logoFileName
      )

      const decodedLogo = Buffer.from(logoBase64, 'base64')
      fs.writeFileSync(logoFilePath, decodedLogo)
    }

    // Insert into organization table
    const organizationInsertQuery =
      'INSERT INTO organization (organization_name, industry_type_id, full_name, email_id, subscription_id, contact_number, sale_email_id, support_email_id, logo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING organization_id'
    const organizationValues = [
      organization_name,
      industry_type_id,
      full_name,
      email_id,
      subscription_id,
      contact_number,
      sales_email_id,
      support_email_id,
      logoFileName
    ]
    const organizationResult1 = await pool.query(
      organizationInsertQuery,
      organizationValues
    )
    const organization_id = organizationResult1.rows[0].organization_id

    //insert into organizaton subscription plan table
    const nowDate = new Date().toISOString().split('T')[0]

    // Check if the subscription_id is non-zero to calculate the end date
    if (subscription_id !== 0) {
      const getSubscriptionQuery =
        'SELECT * FROM subscription_master WHERE subscription_id=$1'
      const getSubscriptionResult = await pool.query(getSubscriptionQuery, [
        subscription_id
      ])
      const period_id = getSubscriptionResult.rows[0].period_id

      const getPeriodQuery = 'SELECT * FROM period_master WHERE period_id=$1'
      const getPeriodResult = await pool.query(getPeriodQuery, [period_id])
      // Get the period and period_unit from the getPeriodResult
      const period = getPeriodResult.rows[0].period // This should be an integer
      const periodUnit = getPeriodResult.rows[0].period_unit // This should be a string like 'days', 'months', 'years'

      // Calculate the end date based on the current date (nowDate), period, and period_unit
      const endDate = calculateEndDate(nowDate, period, periodUnit)
      // Calculate the end date function
      function calculateEndDate (startDate, period, periodUnit) {
        const endDate = new Date(startDate)

        // Use a switch statement to handle different period units (days, months, years)
        switch (periodUnit) {
          case 'days':
            endDate.setDate(endDate.getDate() + period)
            break
          case 'months':
            endDate.setMonth(endDate.getMonth() + period)
            break
          case 'years':
            endDate.setFullYear(endDate.getFullYear() + period)
            break
          default:
            throw new Error('Invalid period unit')
        }

        // Convert the endDate to ISO format
        return endDate.toISOString().split('T')[0]
      }
    } else {
      var endDate = null
    }

    // Insert into organization_subscription_plan table
    const org_sub_plan =
      'INSERT INTO organization_subscription_plan (organization_id, subscription_id, start_date, end_date) VALUES($1, $2, $3, $4)'
    const org_sub_plan_Values = [
      organization_id,
      subscription_id,
      nowDate,
      endDate // Use the calculated end date or null value here
    ]
    const org_sub_plan_Result = await pool.query(
      org_sub_plan,
      org_sub_plan_Values
    )

    // Insert into employee_master table
    const employeeQuery =
      'INSERT INTO employee_master (organization_id, employee_name, designation_id, email_id) VALUES ($1, $2, $3, $4) RETURNING employee_id'
    const employeeValues = [
      organization_id,
      full_name,
      designation_id,
      email_id
    ]
    const employeeResult = await pool.query(employeeQuery, employeeValues)
    const employee_id = employeeResult.rows[0].employee_id

    // Insert into untitled table
    const hash = await bcrypt.hash(password, 10) // Hash the password using bcrypt
    const untitledQuery =
      'INSERT INTO untitled (employee_id, email_id, extenstions,category) VALUES ($1, $2, $3, $4) RETURNING untitled_id'
    const untitledValues = [employee_id, email_id, hash, 2]
    const untitled = await pool.query(untitledQuery, untitledValues)

    // Generate a JWT token
    const token = jwt.sign(
      {
        organization_id: organization_id,
        email_id: email_id,
        employee_id: employee_id
      },
      process.env.JWT_KEY, // Use environment variable for secret key
      { expiresIn: '1h' }
    )

    // Commit the transaction
    await pool.query('COMMIT')

    return res.status(200).json({
      status: 200,
      message: 'Organization sign up successful.',
      token: token,
      category: untitled.category,
      employee_id: employee_id,
      organization: {
        organization_id: organizationResult1.rows[0].organization_id,
        organization_name: organization_name,
        industry_type_id: industry_type_id,
        full_name: full_name,
        email_id: email_id,
        contact_number: contact_number,
        subscription_id: subscription_id
      }
    })
  } catch (error) {
    console.log(error)
    // Rollback the transaction on error
    await pool.query('ROLLBACK')

    return res.status(500).json({
      status: 500,
      message: 'Internal server error.',
      error: error
    })
  }
}

const loginOrganizationUser = async (req, res) => {
  const { email_id, password } = req.body

  try {
    // Check if the organization with the provided email exists and is active
    const checkOrganizationQuery =
      'SELECT * FROM organization WHERE email_id = $1 AND status = 1'
    const organizationResult = await pool.query(checkOrganizationQuery, [
      email_id
    ])
    const organization = organizationResult.rows[0]

    if (!organization) {
      return res.status(401).json({
        status: 401,
        message: 'Authentication failed',
        error: 'Organization Not Found'
      })
    }

    // Check if the employee  with the provided email exists and is active
    const checkEmployeeQuery =
      'SELECT * FROM employee_master WHERE email_id = $1 AND status = 1'
    const employeeResult = await pool.query(checkEmployeeQuery, [email_id])
    const employee = employeeResult.rows[0]

    if (!employee) {
      return res.status(401).json({
        status: 401,
        message: 'Authentication failed',
        error: 'Employee Not Found'
      })
    }

    // Compare the provided password with the hashed password stored in the untitled table
    const checkUntitledQuery = 'SELECT * FROM untitled WHERE email_id = $1'
    const untitledResult = await pool.query(checkUntitledQuery, [email_id])
    const untitled = untitledResult.rows[0]
    if (!untitled) {
      return res.status(401).json({
        status: 401,
        message: 'Authentication failed',
        error: ' Not Found'
      })
    }

    const isPasswordValid = await bcrypt.compare(password, untitled.extenstions)

    if (!isPasswordValid) {
      return res.status(401).json({
        status: 401,
        message: 'Authentication failed'
      })
    }

    // Generate a JWT token
    const token = jwt.sign(
      {
        organization_id: organization.organization_id,
        email_id: organization.email_id,
        employee_id: untitled.employee_id
      },
      process.env.JWT_KEY, // Use environment variable for secret key
      { expiresIn: '1h' }
    )

    return res.status(200).json({
      status: 200,
      message: 'Authentication successful',
      token: token,
      expiresIn: 3600, // 1 hour in seconds,
      category: untitled.category,
      employee_id: untitled.employee_id,
      organization: organization
    })
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: 'Internal Server Error',
      error: error
    })
  }
}

const onStatusChange = async (req, res) => {
  const orgUid = parseInt(req.params.id)
  const status = parseInt(req.query.status) // Validate and parse the status parameter
  try {
    // Check if the Organization user id exists
    const organizationUserQuery =
      'SELECT * FROM organization_users WHERE org_uid = $1'
    const organizationUserResult = await pool.query(organizationUserQuery, [
      orgUid
    ])

    if (organizationUserResult.rowCount === 0) {
      return res.status(404).json({
        status: 404,
        message: 'organizaton user not found.'
      })
    }

    // Validate the status parameter
    if (status !== 0 && status !== 1) {
      return error422("Invalid status value. Status must be 0 (inactive) or 1 (active).", res)
    }

    // Soft update the organization user status
    const updateQuery = `
          UPDATE organization_users
          SET status = $2
          WHERE org_uid = $1
      `

    await pool.query(updateQuery, [orgUid, status])

    const statusMessage = status === 1 ? 'activated' : 'deactivated'

    return res.status(200).json({
      status: 200,
      message: `Organizaton user ${statusMessage} successfully.`
    })
  } catch (error) {
    return error500(error,res)
  }
}
module.exports = {
  createOrganizationUser,
  getOrganizationUsers,
  getOrganizationUser,
  updateOrganizationUser,
  // organizationSignUp,
  // organizationLogin,
  onStatusChange
}

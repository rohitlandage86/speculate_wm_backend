const pool = require('../../../db')
const fs = require('fs') // Required for file system operations
const path = require('path') // Required for working with file paths
// const bcrypt = require("bcrypt");
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
//create organization...
const createOrganization = async (req, res) => {
  const org_name = req.body.org_name ? req.body.org_name.trim() : ''
  const short_name = req.body.short_name ? req.body.short_name.trim() : ''
  const email_id = req.body.email_id ? req.body.email_id.trim() : ''
  const contact_number = req.body.contact_number
    ? req.body.contact_number
    : null
  const country = req.body.country ? req.body.country.trim() : ''
  const state = req.body.state ? req.body.state.trim() : ''
  const city = req.body.city ? req.body.city.trim() : ''
  const address = req.body.address ? req.body.address.trim() : ''
  const logo1Name = req.body.logo1Name ? req.body.logo1Name.trim() : ''
  const logo1Base64 = req.body.logo1Base64 ? req.body.logo1Base64.trim() : ''
  const logo2Name = req.body.logo2Name ? req.body.logo2Name.trim() : ''
  const logo2Base64 = req.body.logo2Base64 ? req.body.logo2Base64.trim() : ''
  const untitled_id = req.companyData.untitled_id;
  if (!org_name) {
    return error422('Organization name is required.', res)
  } else if (!short_name) {
    return error422('Short name is required.', res)
  } else if (!email_id) {
    return error422('Email id is required.', res)
  } else if (!contact_number) {
    return error422('Contact number is required.', res)
  } else if (!country) {
    return error422('Country is required.', res)
  } else if (!state) {
    return error422('State is required.', res)
  } else if (!city) {
    return error422('City is required.', res)
  } else if (!address) {
    return error422('Address is required.', res)
  } else if (!logo1Name || !logo1Base64) {
    return error422('Logo 1 is required.', res)
  }

  // Generate logo1FileName and logo1FilePath if logo1Name provided
  let logo1FileName = ''
  let logo1FilePath = ''
  if (logo1Name && logo1Base64) {
    const timestamp = Date.now()
    const fileExtension = path.extname(logo1Name)
    logo1FileName = `${org_name}_${timestamp}${fileExtension}`
    logo1FilePath = path.join(
      __dirname,
      '..',
      '..',
      'images',
      'logo1',
      logo1FileName
    )

    const decodedLogo = Buffer.from(logo1Base64, 'base64')
    fs.writeFileSync(logo1FilePath, decodedLogo)
  }

  // Generate logo2FileName and logo2FilePath if logo2Name provided
  let logo2FileName = ''
  let logo2FilePath = ''
  if (logo2Name && logo2Base64) {
    const timestamp = Date.now()
    const fileExtension = path.extname(logo2Name)
    logo2FileName = `${org_name}_${timestamp}${fileExtension}`
    logo2FilePath = path.join(
      __dirname,
      '..',
      '..',
      'images',
      'logo2',
      logo2FileName
    )

    const decodedLogo = Buffer.from(logo2Base64, 'base64')
    fs.writeFileSync(logo2FilePath, decodedLogo)
  }

  let connection

  try {
    connection = await pool.connect()

    //check is Organization name exist...
    const checkOrgNameQuery =
      'SELECT * FROM organization WHERE TRIM(LOWER(org_name)) = $1'
    const checkOrgNameResult = await connection.query(checkOrgNameQuery, [
      org_name.toLowerCase()
    ])
    if (checkOrgNameResult.rowCount > 0) {
      if (fs.existsSync(logo1FilePath)) {
        fs.unlinkSync(logo1FilePath)
      }
      if (fs.existsSync(logo2FilePath)) {
        fs.unlinkSync(logo2FilePath)
      }
      return error422('Organization Name is already exist.', res)
    }
    //check is short name exist...
    const checkShortNameQuery =
      'SELECT * FROM organization WHERE TRIM(LOWER(short_name)) = $1'
    const checkShortNameResult = await connection.query(checkShortNameQuery, [
      short_name.toLowerCase()
    ])
    if (checkShortNameResult.rowCount > 0) {
      if (fs.existsSync(logo1FilePath)) {
        fs.unlinkSync(logo1FilePath)
      }
      if (fs.existsSync(logo2FilePath)) {
        fs.unlinkSync(logo2FilePath)
      }
      return error422('Short Name is already exist.', res)
    }
    //check is Email Id exist...
    const checkEmailQuery =
      'SELECT * FROM untitled WHERE TRIM(LOWER(email_id)) = $1'
    const checkEmailResult = await connection.query(checkEmailQuery, [
      email_id.toLowerCase()
    ])
    if (checkEmailResult.rowCount > 0) {
      if (fs.existsSync(logo1FilePath)) {
        fs.unlinkSync(logo1FilePath)
      }
      if (fs.existsSync(logo2FilePath)) {
        fs.unlinkSync(logo2FilePath)
      }
      return error422('Email id is already exist.', res)
    }
    //check is Contact Number exist...
    const checkContactNumberQuery =
      'SELECT * FROM organization WHERE TRIM(LOWER(contact_number)) = $1'
    const checkContactNumberResult = await connection.query(
      checkContactNumberQuery,
      [contact_number.toLowerCase()]
    )
    if (checkContactNumberResult.rowCount > 0) {
      if (fs.existsSync(logo1FilePath)) {
        fs.unlinkSync(logo1FilePath)
      }
      if (fs.existsSync(logo2FilePath)) {
        fs.unlinkSync(logo2FilePath)
      }
      return error422('Contact Number is already exist.', res)
    }

    //organization insert
    const orgQuery =
      'INSERT INTO organization (org_name, short_name, email_id, contact_number, country, state, city, address, logo1, logo2, untitled_id ) values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)'
    await connection.query(orgQuery, [
      org_name,
      short_name,
      email_id,
      contact_number,
      country,
      state,
      city,
      address,
      logo1FileName,
      logo2FileName,
      untitled_id
    ])

    res.status(200).json({
      status: 200,
      message: 'Organization created successfully'
    })
  } catch (error) {
    if (fs.existsSync(logo1FilePath)) {
      fs.unlinkSync(logo1FilePath)
    }
    if (fs.existsSync(logo2FilePath)) {
      fs.unlinkSync(logo2FilePath)
    }

    return error500(error, res)
  } finally {
    if (connection) {
      connection.release()
    }
  }
}
// get organizations...
const getOrganizations = async (req, res) => {
  const { page, perPage } = req.query

  try {
    let query = `SELECT * FROM organization`
    let countQuery = ` SELECT COUNT(*) AS total FROM organization`
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
// get organization by id...
const getOrganization = async (req, res) => {
  const org_id = parseInt(req.params.id)
  if (!org_id) {
    return error422("Organization id is required.", res)
  }
  let connection
  try {
    connection = await pool.connect()
    const query = 'SELECT * FROM organization WHERE org_id = $1'
    const result = await connection.query(query, [org_id])

    if (result.rowCount === 0) {
      return error422('Organization is Not Found', res)
    }
    const organization = result.rows[0]
    return res.status(200).json({
      status: 200,
      message: 'Organization retrieved successfully.',
      data: organization
    })
  } catch (error) {
    return error500(error, res)
  } finally {
    if (connection) {
      connection.release()
    }
  }
}

const updateOrganization = async (req, res) => {
  const org_id = parseInt(req.params.id)
  const org_name = req.body.org_name ? req.body.org_name.trim() : ''
  const short_name = req.body.short_name ? req.body.short_name.trim() : ''
  const email_id = req.body.email_id ? req.body.email_id.trim() : ''
  const contact_number = req.body.contact_number
    ? req.body.contact_number
    : null
  const country = req.body.country ? req.body.country.trim() : ''
  const state = req.body.state ? req.body.state.trim() : ''
  const city = req.body.city ? req.body.city.trim() : ''
  const address = req.body.address ? req.body.address.trim() : ''
  const logo1Name = req.body.logo1Name ? req.body.logo1Name.trim() : ''
  const logo1Base64 = req.body.logo1Base64 ? req.body.logo1Base64.trim() : ''
  const logo2Name = req.body.logo2Name ? req.body.logo2Name.trim() : ''
  const logo2Base64 = req.body.logo2Base64 ? req.body.logo2Base64.trim() : ''
  const untitled_id = req.companyData.untitled_id;
  if (!org_id) {
    return error422('Organization id is required.', res)
  } else if (!org_name) {
    return error422('Organization name is required.', res)
  } else if (!short_name) {
    return error422('Short name is required.', res)
  } else if (!email_id) {
    return error422('Email id is required.', res)
  } else if (!contact_number) {
    return error422('Contact number is required.', res)
  } else if (!country) {
    return error422('Country is required.', res)
  } else if (!state) {
    return error422('State is required.', res)
  } else if (!city) {
    return error422('City is required.', res)
  } else if (!address) {
    return error422('Address is required.', res)
  } else if (!logo1Name || !logo1Base64) {
    return error422('Logo 1 is required.', res)
  }

  let connection
  connection = await pool.connect()

  // Check if organization exists
  const checkOrgQuery = 'SELECT * FROM organization WHERE org_id = $1'
  const orgResult = await connection.query(checkOrgQuery, [org_id])
  if (orgResult.rowCount === 0) {
    return error422('Organization is Not Found', res)
  }

  //check org name is exist
  const checkOrgNameQuery =
    'SELECT * FROM organization WHERE TRIM(LOWER(org_name)) = $1 AND org_id != $2'
  const checkOrgNameResult = await connection.query(checkOrgNameQuery, [
    org_name.toLowerCase(),
    org_id
  ])
  if (checkOrgNameResult.rowCount > 0) {
    return error422('Organization name is already exist.', res)
  }
  //check is short name exist
  const checkShortNameQuery =
    'SELECT * FROM organization WHERE TRIM(LOWER(short_name)) = $1 AND org_id != $2'
  const checkShortNameResult = await connection.query(checkShortNameQuery, [
    short_name.toLowerCase(),
    org_id
  ])
  if (checkShortNameResult.rowCount > 0) {
    return error422('Short name is already exist.', res)
  }
  //check is email id exist
  const checkEmailQuery = 'SELECT * FROM untitled  WHERE email_id = $1'
  const checkEmailResult = await connection.query(checkEmailQuery, [
    email_id.toLowerCase()
  ])
  if (checkEmailResult.rowCount > 1) {
    return error422('Email id is already exist.', res)
  }
  //check contact number is exist
  const checkContactNumberQuery =
    'SELECT * FROM organization WHERE contact_number = $1 AND org_id != $2'
  const checkContactNumberResult = await connection.query(
    checkContactNumberQuery,
    [contact_number, org_id]
  )
  if (checkContactNumberResult.rowCount > 0) {
    return error422('Contact number is already exsist.', res)
  }

  // Generate logo1FileName and logo1FilePath if logo1Name provided
  let logo1FileName = ''
  let logo1FilePath = ''
  if (logo1Name && logo1Base64) {
    const timestamp = Date.now()
    const fileExtension = path.extname(logo1Name)
    logo1FileName = `${org_name}_${timestamp}${fileExtension}`
    logo1FilePath = path.join(
      __dirname,
      '..',
      '..',
      'images',
      'logo1',
      logo1FileName
    )

    const decodedLogo = Buffer.from(logo1Base64, 'base64')
    fs.writeFileSync(logo1FilePath, decodedLogo)
  }

  // Generate logo2FileName and logo2FilePath if logo2Name provided
  let logo2FileName = ''
  let logo2FilePath = ''
  if (logo2Name && logo2Base64) {
    const timestamp = Date.now()
    const fileExtension = path.extname(logo2Name)
    logo2FileName = `${org_name}_${timestamp}${fileExtension}`
    logo2FilePath = path.join(
      __dirname,
      '..',
      '..',
      'images',
      'logo2',
      logo2FileName
    )

    const decodedLogo = Buffer.from(logo2Base64, 'base64')
    fs.writeFileSync(logo2FilePath, decodedLogo)
  }

  try {
    // Update the organization record with new data
    const nowDate = new Date().toISOString().split('T')[0]
    const updateQuery = `
          UPDATE organization
          SET org_name = $1, short_name = $2, email_id = $3,  contact_number = $4, country = $5, state = $6, city = $7, address = $8, logo1 = $9, logo2 = $10, untitled_id = $11
          WHERE org_id = $12
      `
    const updateResult = await connection.query(updateQuery, [
      org_name,
      short_name,
      email_id,
      contact_number,
      country,
      state,
      city,
      address,
      logo1FileName,
      logo2FileName,
      org_id,
      untitled_id
    ])
    //unlink exist logo1
    if (orgResult.rows[0].logo1) {
      let logo1FilePathExist
      logo1FilePathExist = path.join(
        __dirname,
        '..',
        '..',
        'images',
        'logo1',
        orgResult.rows[0].logo1
      )
      if (fs.existsSync(logo1FilePathExist)) {
        fs.unlinkSync(logo1FilePathExist)
      }
    }
    //unlink exist logo2
    if (orgResult.rows[0].logo2) {
      let logo2FilePathExist
      logo2FilePathExist = path.join(
        __dirname,
        '..',
        '..',
        'images',
        'logo2',
        orgResult.rows[0].logo2
      )
      if (fs.existsSync(logo2FilePathExist)) {
        fs.unlinkSync(logo2FilePathExist)
      }
    }

    return res.status(200).json({
      status: 200,
      message: 'Organization updated successfully.'
    })
  } catch (error) {
    if (fs.existsSync(logo1FilePath)) {
      fs.unlinkSync(logo1FilePath)
    }
    if (fs.existsSync(logo2FilePath)) {
      fs.unlinkSync(logo2FilePath)
    }
    return error500(error, res)
  } finally {
    connection.release()
  }
}
const signUpOrganization = async (req, res) => {
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
      function calculateEndDate(startDate, period, periodUnit) {
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

const loginOrganization = async (req, res) => {
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
  const organizationId = parseInt(req.params.id)
  const status = parseInt(req.query.status) // Validate and parse the status parameter
  try {
    // Check if the Organization exists
    const organizationQuery =
      'SELECT * FROM organization WHERE organization_id = $1'
    const organizationResult = await pool.query(organizationQuery, [
      organizationId
    ])

    if (organizationResult.rowCount === 0) {
      return res.status(404).json({
        status: 404,
        message: 'organizaton not found.'
      })
    }

    // Validate the status parameter
    if (status !== 0 && status !== 1) {
      return res.status(400).json({
        status: 400,
        message:
          'Invalid status value. Status must be 0 (inactive) or 1 (active).'
      })
    }

    // Soft update the organization status
    const updateQuery = `
          UPDATE organization
          SET status = $2
          WHERE organization_id = $1
      `

    await pool.query(updateQuery, [organizationId, status])

    const statusMessage = status === 1 ? 'activated' : 'deactivated'

    return res.status(200).json({
      status: 200,
      message: `Organizaton ${statusMessage} successfully.`
    })
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({
      status: 500,
      message: 'Internal Server Error',
      error: error
    })
  }
}
module.exports = {
  createOrganization,
  getOrganizations,
  getOrganization,
  updateOrganization
  // organizationSignUp,
  // organizationLogin,
  // onStatusChange
}

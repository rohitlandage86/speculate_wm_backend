const pool = require('../../../db')

//handle error 422
error422 = (message, res) => {
  return res.status(422).json({
    status: 422,
    message: message
  })
}
//handle error 500
error500 = (error, res) => {
  return res.status(500).json({
    status: 500,
    message: 'Internal Server Error',
    error: error
  })
}
// create configuration...
const createConfiguration = async (req, res) => {
  const url_name = req.body.url_name ? req.body.url_name.trim() : ''
  const base_url = req.body.base_url ? req.body.base_url.trim() : ''
  const description = req.body.description ? req.body.description.trim() : ''
  const untitled_id = req.companyData.untitled_id

  if (!url_name) {
    return error422('Url name is required.', res)
  } else if (!base_url) {
    return error422('Base url is required.', res)
  } else if (!untitled_id) {
    return error422('untitled id is required.', res)
  }
  let connection

  try {
    connection = await pool.connect()

    //insert into configuration table
    const insertQuery =
      'INSERT INTO configuration (url_name, base_url, description, untitled_id) VALUES ($1, $2, $3, $4)'
    const insertResult = await connection.query(insertQuery, [
      url_name,
      base_url,
      description,
      untitled_id
    ])

    return res.status(200).json({
      status: 200,
      message: 'Configuration created successfully.'
    })
  } catch (error) {
    return error500(error, res)
  } finally {
    if (connection) connection.release()
  }
}
//get configuration list...
const getConfigurations = async (req, res) => {
  const { page, perPage, key } = req.query
  let connection
  try {
    connection = await pool.connect()
    let query = 'SELECT * FROM configuration'
    let countQuery = 'SELECT COUNT(*) AS total FROM configuration'
    if (key) {
      const lowercaseKey = key.toLowerCase().trim()
      if (key === 'activated') {
        query += ' WHERE status = 1'
        countQuery += ' WHERE status = 1'
      } else if (key === 'deactivated') {
        query += ' WHERE status = 0'
        countQuery += ' WHERE status = 0'
      } else {
        query += ` WHERE LOWER(url_name) LIKE '%${lowercaseKey}%'`
        countQuery += ` WHERE LOWER(url_name) LIKE '%${lowercaseKey}%'`
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
    const sports = result.rows
    const data = {
      status: 200,
      message: 'Configuration retrieved successfully',
      data: sports
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
    if (connection)  connection.release()
  }
}
//get configuration by id...
const getConfiguration = async (req, res) => {
  const con_id = req.params.id

  let connection
  try {
    connection = await pool.connect()
    let query = 'SELECT * FROM configuration WHERE con_id = $1'
    const result = await connection.query(query, [con_id])
    if (result.rowCount === 0) {
      return error422('Configuration is Not Found', res)
    }
    const configuration = result.rows[0]
    const data = {
      status: 200,
      message: 'Configuration retrieved successfully',
      data: configuration
    }
    return res.status(200).json(data)
  } catch (error) {
    error500(error, res)
  } finally {
    if (connection) connection.release()
  }
}
//update configuration
const updateConfiguration = async (req, res) => {
  const con_id = parseInt(req.params.id)
  const url_name = req.body.url_name ? req.body.url_name.trim() : ''
  const base_url = req.body.base_url ? req.body.base_url.trim() : ''
  const description = req.body.description ? req.body.description.trim() : ''
  const untitled_id = req.companyData.untitled_id

  if (!con_id) {
    return error422('Configuration Id is required.', res)
  } else if (!url_name) {
    return error422('URL name is required.', res)
  } else if (!base_url) {
    return error422('Base URL is required .', res)
  } else if (!untitled_id) {
    return error422('Untitled id is required.', res)
  }
  let connection
  connection = await pool.connect()
  // check if configuration exists
  const checkConfigurationQuery =
    'SELECT * FROM configuration WHERE con_id = $1'
  const checkConfigurationResult = await connection.query(
    checkConfigurationQuery,
    [con_id]
  )
  if (checkConfigurationResult.rowCount === 0) {
    return error422('Configuration is Not Found', res)
  }
  //check is url name exist
  const checkUrlNameQuery =
    'SELECT * FROM configuration WHERE TRIM(LOWER(url_name)) = $1 AND con_id != $2'
  const checkUrlNameResult = await connection.query(checkUrlNameQuery, [
    url_name.toLowerCase(),
    con_id
  ])
  if (checkUrlNameResult.rowCount > 0) {
    return error422('URL name is already exist.', res)
  }

  try {
    //update the configuration record with new data
    const updateQuery = `
      UPDATE configuration
      SET url_name = $1, base_url = $2, description = $3, untitled_id =$4
      WHERE con_id = $5
      `
    const updateResult = await connection.query(updateQuery, [
      url_name,
      base_url,
      description,
      untitled_id,
      con_id
    ])
    return res.status(200).json({
      status: 200,
      message: 'Configuration updated successfully.'
    })
  } catch (error) {
    return error500(error, res)
  } finally {
    if (connection) connection.release()
  }
}
//configuration status change
const onStatusChange = async (req, res) => {
  const con_id = parseInt(req.params.id)
  const status = parseInt(req.query.status) // Validate and parse the status parameter
  let connection
  connection = await pool.connect()
  try {
    // Check if the configuration exists
    const configurationQuery = 'SELECT * FROM configuration WHERE con_id = $1'
    const configurationResult = await connection.query(configurationQuery, [con_id])

    if (configurationResult.rowCount === 0) {
      return res.status(404).json({
        status: 404,
        message: 'Configuration not found.'
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

    // Soft update the configuration status
    const updateQuery = `
            UPDATE configuration
            SET status = $1
            WHERE con_id = $2
        `

    await connection.query(updateQuery, [status, con_id])

    const statusMessage = status === 1 ? 'activated' : 'deactivated'

    return res.status(200).json({
      status: 200,
      message: `Configuration ${statusMessage} successfully.`
    })
  } catch (error) {
    return error500(error, res)
  } finally {
    if (connection) connection.release()
  }
}
//get configuration Wma...
const getConfigurationsWma = async (req, res)=>{
  let connection
  connection = await pool.connect()
  try{
      let query = "SELECT * FROM configuration WHERE status = 1 ORDER BY cts DESC";
      const result = await connection.query(query);
      const states = result.rows;
      return  res.status(200).json({
          status:200,
          message:"Configuration retrieved successfully.",
          data: states
      });

  } catch (error){
     return error500(error,res)
  } finally {
      if(connection) connection.release()
  }


}
module.exports = {
  createConfiguration,
  getConfiguration,
  getConfigurations,
  updateConfiguration,
  onStatusChange,
  getConfigurationsWma
}

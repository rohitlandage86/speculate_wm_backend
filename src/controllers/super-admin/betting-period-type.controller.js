const pool = require('../../../db')
//error 422 handler
error422 = (message, res) => {
  return res.status(422).json({
    status: 422,
    message: message
  })
}
//error 500 handler
error500 = (error, res) => {
  console.log(error);
  return res.status(500).json({
    status: 500,
    message: 'Internal Server Error',
    error: error
  })
}
//create betting period type
const createBettingPeriodType = async (req, res) => {
  const record_id = req.body.record_id ? req.body.record_id : null
  const name = req.body.name ? req.body.name.trim() : ''
  const sport_id = req.body.sport_id ? req.body.sport_id : null
  const untitled_id = req.companyData.untitled_id

  if (!record_id) {
    return error422('Record id is required.', res)
  } else if (!name) {
    return error422('Name is required.', res)
  } else if (!sport_id) {
    return error422('Sport id is required.', res)
  } else if (!untitled_id) {
    return error422('Untitled id is required.', res)
  }

  // let connection
  try {
    connection = await pool.connect()
    //check is name exist
    let checkNameExist =
      'SELECT * FROM betting_period_types WHERE TRIM(LOWER(name)) = $1 AND sport_id = $2'
    let nameResult = await connection.query(checkNameExist, [
      name.toLowerCase(),
      sport_id
    ])
    if (nameResult.rowCount > 0) {
      return error422('Name already exist.', res)
    }
    //check is record id exist
    let checkRecordIdExist =
      'SELECT * FROM betting_period_types WHERE record_id = $1 AND sport_id = $2'
    let recordIdResult = await connection.query(checkRecordIdExist, [
      record_id,
      sport_id
    ])
    if (recordIdResult.rowCount > 0) {
      return error422('Record id already exist.', res)
    }
    //insert betting period types table
    const bettingPeriodTypeQuery =
      'INSERT INTO betting_period_types (name, record_id, sport_id, untitled_id) VALUES ($1, $2, $3, $4)'
    await connection.query(bettingPeriodTypeQuery, [
      name,
      record_id,
      sport_id,
      untitled_id
    ])
    return res.status(200).json({
      status: 200,
      message: 'Betting period type created successfully.'
    })
  } catch (error) {
    error500(error, res)
  } finally {
    if (connection) connection.release()
  }
}
//get betting period types list...
const getBettingPeriodTypes = async (req, res) => {
  const { page, perPage, key } = req.query
  let connection
  try {
    connection = await pool.connect()
    let query = `SELECT bp.*, s.sports_name, s.small_name FROM betting_period_types bp LEFT JOIN sports s ON s.sport_id = bp.sport_id `
    let countQuery = `SELECT COUNT(*) AS total FROM betting_period_types bp LEFT JOIN sports s ON s.sport_id = bp.sport_id `
    if (key) {
      const lowercaseKey = key.toLowerCase().trim()
      if (key === 'activated') {
        query += ' WHERE bp.status = 1'
        countQuery += ' WHERE bp.status = 1'
      } else if (key === 'deactivated') {
        query += ' WHERE bp.status = 0'
        countQuery += ' WHERE bp.status = 0'
      } else {
        query += ` WHERE LOWER(bp.name) LIKE '%${lowercaseKey}%' `
        countQuery += ` WHERE LOWER(bp.name) LIKE '%${lowercaseKey}%' `
      }
    }

    query += ' ORDER BY bp.cts DESC'
    let total = 0
    // Apply pagination if both page and perPage are provided
    if (page && perPage) {
      const totalResult = await connection.query(countQuery)
      total = parseInt(totalResult.rows[0].total)

      const start = (page - 1) * perPage
      query += ` LIMIT '${perPage}' OFFSET '${start}'`
    }
    const result = await connection.query(query)
    const bettingPeriodTypes = result.rows
    const data = {
      status: 200,
      message: 'Betting period types retrieved successfully',
      data: bettingPeriodTypes
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
    if (connection) connection.release()
  }
}

//get betting period type by id...
const getBettingPeriodType = async (req, res) => {
  const betting_period_type_id = parseInt(req.params.id)

  if (!betting_period_type_id) {
    return error422('Betting period type id is required.', res)
  }
  let connection
  try {
    connection = await pool.connect()
    let query =
      'SELECT bp.*, s.sports_name, s.small_name FROM betting_period_types bp LEFT JOIN sports s ON s.sport_id = bp.sport_id WHERE bp.betting_period_type_id = $1'
    const result = await connection.query(query, [betting_period_type_id])
    if (result.rowCount === 0) {
      return error422('Betting period type is Not Found', res)
    }
    let betting_period_types = result.rows[0]
    const data = {
      status: 200,
      message: 'Betting period type retrieved successfully',
      data: betting_period_types
    }
    return res.status(200).json(data)
  } catch (error) {
    error500(error, res)
  } finally {
    if (connection) connection.release()
  }
}

//update betting period type 
const updateBettingPeriodType = async (req, res) => {
  const betting_period_type_id = parseInt(req.params.id)
  const record_id = req.body.record_id ? req.body.record_id : null
  const name = req.body.name ? req.body.name.trim() : ''
  const sport_id = req.body.sport_id ? req.body.sport_id : null
  const untitled_id = req.companyData.untitled_id

  if (!sport_id) {
    return error422('Sport id is required.', res)
  } else if (!record_id) {
    return error422('Record id is required.', res)
  } else if (!name) {
    return error422('Name is required .', res)
  } else if (!betting_period_type_id) {
    return error422('Betting period type id is required.', res)
  } else if (!untitled_id) {
    return error422('Untitled id is required.', res)
  }

  let connection
  connection = await pool.connect()
  // check if betting period types exists
  const checkBettingPeriodTypeQuery = 'SELECT * FROM betting_period_types WHERE betting_period_type_id = $1'
  const checkBettingPeriodTypeResult = await connection.query(checkBettingPeriodTypeQuery, [betting_period_type_id])
  if (checkBettingPeriodTypeResult.rowCount === 0) {
    return error422('Betting period type is Not Found', res)
  }
  //check is name exist
  const checkBettingPeriodTypeNameQuery =
    'SELECT * FROM betting_period_types WHERE (TRIM(LOWER(name)) = $1 AND sport_id = $2 ) AND betting_period_type_id != $3'
  const checkBettingPeriodTypeNameResult = await connection.query(checkBettingPeriodTypeNameQuery, [
    name.toLowerCase(),
    sport_id,
    betting_period_type_id
  ])
  if (checkBettingPeriodTypeNameResult.rowCount > 0) {
    return error422('Name is already exist.', res)
  }
  //check is record id  exist
  const checkBettingPeriodTypeRecordIdQuery =
    'SELECT * FROM betting_period_types WHERE (record_id = $1 AND sport_id = $2 ) AND betting_period_type_id != $3'
  const checkBettingPeriodTypeRecordIdResult = await connection.query(checkBettingPeriodTypeRecordIdQuery, [
    record_id,
    sport_id,
    betting_period_type_id
  ])
  if (checkBettingPeriodTypeRecordIdResult.rowCount > 0) {
    return error422('Record id is already exist.', res)
  }
  try {
    //update the betting period type record with new data
    const updateQuery = `
      UPDATE betting_period_types
      SET name = $1, sport_id = $2, record_id = $3, untitled_id =$4
      WHERE betting_period_type_id = $5
      `
    const updateResult = await connection.query(updateQuery, [
      name,
      sport_id,
      record_id,
      untitled_id,
      betting_period_type_id
    ])

    return res.status(200).json({
      status: 200,
      message: 'Betting period type updated successfully.'
    })
  } catch (error) {
    return error500(error, res)
  } finally {
    if (connection) connection.release()
  }
}
//betting period type status change
const onStatusChange = async (req, res) => {
  const bettingPeriodTypeId = parseInt(req.params.id)
  const status = parseInt(req.query.status) // Validate and parse the status parameter
  let connection
  connection = await pool.connect()
  try {
    // Check if the betting period type exists
    const bettingPeriodTypeQuery = 'SELECT * FROM betting_period_types WHERE betting_period_type_id = $1'
    const bettingPeriodTypeResult = await connection.query(bettingPeriodTypeQuery, [bettingPeriodTypeId])

    if (bettingPeriodTypeResult.rowCount === 0) {
      return res.status(404).json({
        status: 404,
        message: 'Betting period type not found.'
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

    // Soft update the betting outcome type status
    const updateQuery = `
            UPDATE betting_period_types
            SET status = $1
            WHERE betting_period_type_id = $2
        `

    await connection.query(updateQuery, [status, bettingPeriodTypeId])

    const statusMessage = status === 1 ? 'activated' : 'deactivated'

    return res.status(200).json({
      status: 200,
      message: `Betting period type ${statusMessage} successfully.`
    })
  } catch (error) {
    return error500(error, res)
  } finally {
    if (connection) connection.release()
  }
}
//get betting period types Wma...
const getBettingPeriodTypesWma = async (req, res) => {
  let connection
  connection = await pool.connect()
  try {
    let query = 'SELECT * FROM betting_period_types WHERE status = 1 ORDER BY cts DESC'
    const result = await connection.query(query)
    const bettingPeriodTypes = result.rows
    return res.status(200).json({
      status: 200,
      message: 'Betting period type retrieved successfully.',
      data: bettingPeriodTypes
    })
  } catch (error) {
    return error500(error, res)
  } finally {
    if (connection) connection.release()
  }
}

module.exports = {
  createBettingPeriodType,
  getBettingPeriodTypes,
  getBettingPeriodType,
  updateBettingPeriodType,
  onStatusChange,
  getBettingPeriodTypesWma

}

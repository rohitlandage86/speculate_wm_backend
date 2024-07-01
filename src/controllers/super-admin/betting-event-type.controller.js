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
  return res.status(500).json({
    status: 500,
    message: 'Internal Server Error',
    error: error
  })
}
//create betting event type
const createBettingEventType = async (req, res) => {
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
      'SELECT * FROM betting_event_types WHERE TRIM(LOWER(name)) = $1'
    let nameResult = await connection.query(checkNameExist, [
      name.toLowerCase()
    ])
    if (nameResult.rowCount > 0) {
      return error422('Name already exist.', res)
    }
    //check is record id exist
    let checkRecordIdExist =
      'SELECT * FROM betting_event_types WHERE record_id = $1'
    let recordIdResult = await connection.query(checkRecordIdExist, [
      record_id
    ])
    if (recordIdResult.rowCount > 0) {
      return error422('Record id already exist.', res)
    }
    //insert betting event types table
    const bettingEventTypeQuery =
      'INSERT INTO betting_event_types (name, record_id, sport_id, untitled_id) VALUES ($1, $2, $3, $4)'
    await connection.query(bettingEventTypeQuery, [
      name,
      record_id,
      sport_id,
      untitled_id
    ])
    return res.status(200).json({
      status: 200,
      message: 'Betting event type created successfully.'
    })
  } catch (error) {
    error500(error, res)
  } finally {
    if (connection) connection.release()
  }
}
//get betting event types list...
const getBettingEventTypes = async (req, res) => {
  const { page, perPage, key } = req.query
  let connection
  try {
    connection = await pool.connect()
    let query = `SELECT bv.*, s.sports_name, s.small_name FROM betting_event_types bv LEFT JOIN sports s ON s.sport_id = bv.sport_id `
    let countQuery = `SELECT COUNT(*) AS total FROM betting_event_types bv LEFT JOIN sports s ON s.sport_id = bv.sport_id `
    if (key) {
      const lowercaseKey = key.toLowerCase().trim()
      if (key === 'activated') {
        query += ' WHERE bv.status = 1'
        countQuery += ' WHERE bv.status = 1'
      } else if (key === 'deactivated') {
        query += ' WHERE bv.status = 0'
        countQuery += ' WHERE bv.status = 0'
      } else {
        query += ` WHERE LOWER(bv.name) LIKE '%${lowercaseKey}%' `
        countQuery += ` WHERE LOWER(bv.name) LIKE '%${lowercaseKey}%' `
      }
    }

    query += ' ORDER BY bv.cts DESC'
    let total = 0
    // Apply pagination if both page and perPage are provided
    if (page && perPage) {
      const totalResult = await connection.query(countQuery)
      total = parseInt(totalResult.rows[0].total)

      const start = (page - 1) * perPage
      query += ` LIMIT '${perPage}' OFFSET '${start}'`
    }
    const result = await connection.query(query)
    const bettingEventTypes = result.rows
    const data = {
      status: 200,
      message: 'Betting event types retrieved successfully',
      data: bettingEventTypes
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

//get betting event type by id...
const getBettingEventType = async (req, res) => {
  const betting_event_type_id = parseInt(req.params.id)

  if (!betting_event_type_id) {
    return error422('Betting event type id is required.', res)
  }
  let connection
  try {
    connection = await pool.connect()
    let query =
      'SELECT bv.*, s.sports_name, s.small_name FROM betting_event_types bv LEFT JOIN sports s ON s.sport_id = bv.sport_id WHERE bv.betting_event_type_id = $1'
    const result = await connection.query(query, [betting_event_type_id])
    if (result.rowCount === 0) {
      return error422('Betting event type is Not Found', res)
    }
    let betting_event_types = result.rows[0]
    const data = {
      status: 200,
      message: 'Betting event type retrieved successfully',
      data: betting_event_types
    }
    return res.status(200).json(data)
  } catch (error) {
    error500(error, res)
  } finally {
    if (connection) connection.release()
  }
}

//update betting event type 
const updateBettingEventType = async (req, res) => {
  const betting_event_type_id = parseInt(req.params.id)
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
  } else if (!betting_event_type_id) {
    return error422('Betting event type id is required.', res)
  } else if (!untitled_id) {
    return error422('Untitled id is required.', res)
  }

  let connection
  connection = await pool.connect()
  // check if betting event types exists
  const checkBettingEventTypeQuery = 'SELECT * FROM betting_event_types WHERE betting_event_type_id = $1'
  const checkBettingEventTypeResult = await connection.query(checkBettingEventTypeQuery, [betting_event_type_id])
  if (checkBettingEventTypeResult.rowCount === 0) {
    return error422('Betting event type is Not Found', res)
  }
  //check is name exist
  const checkBettingEventTypeNameQuery =
    'SELECT * FROM betting_event_types WHERE TRIM(LOWER(name)) = $1 AND betting_event_type_id != $2'
  const checkBettingEventTypeNameResult = await connection.query(checkBettingEventTypeNameQuery, [
    name.toLowerCase(),
    betting_event_type_id
  ])
  if (checkBettingEventTypeNameResult.rowCount > 0) {
    return error422('Name is already exist.', res)
  }
  //check is record id  exist
  const checkBettingEventTypeRecordIdQuery =
    'SELECT * FROM betting_event_types WHERE record_id = $1 AND betting_event_type_id != $2'
  const checkBettingEventTypeRecordIdResult = await connection.query(checkBettingEventTypeRecordIdQuery, [
    record_id,
    betting_event_type_id
  ])
  if (checkBettingEventTypeRecordIdResult.rowCount > 0) {
    return error422('Record id is already exist.', res)
  }

  try {
    //update the betting event type record with new data
    const updateQuery = `
      UPDATE betting_event_types
      SET name = $1, sport_id = $2, record_id = $3, untitled_id =$4
      WHERE betting_event_type_id = $5
      `
    const updateResult = await connection.query(updateQuery, [
      name,
      sport_id,
      record_id,
      untitled_id,
      betting_event_type_id
    ])

    return res.status(200).json({
      status: 200,
      message: 'Betting event type updated successfully.'
    })
  } catch (error) {
    return error500(error, res)
  } finally {
    if (connection) connection.release()
  }
}
//betting event type status change
const onStatusChange = async (req, res) => {
  const bettingEventTypeId = parseInt(req.params.id)
  const status = parseInt(req.query.status) // Validate and parse the status parameter
  let connection
  connection = await pool.connect()
  try {
    // Check if the betting event type exists
    const bettingEventTypeQuery = 'SELECT * FROM betting_event_types WHERE betting_event_type_id = $1'
    const bettingEventTypeResult = await connection.query(bettingEventTypeQuery, [bettingEventTypeId])

    if (bettingEventTypeResult.rowCount === 0) {
      return res.status(404).json({
        status: 404,
        message: 'Betting event type not found.'
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

    // Soft update the betting event type status
    const updateQuery = `
            UPDATE betting_event_types
            SET status = $1
            WHERE betting_event_type_id = $2
        `

    await connection.query(updateQuery, [status, bettingEventTypeId])

    const statusMessage = status === 1 ? 'activated' : 'deactivated'

    return res.status(200).json({
      status: 200,
      message: `Betting event type ${statusMessage} successfully.`
    })
  } catch (error) {
    return error500(error, res)
  } finally {
    if (connection) connection.release()
  }
}
//get betting event types Wma...
const getBettingEventTypesWma = async (req, res) => {
  let connection
  connection = await pool.connect()
  try {
    let query = 'SELECT * FROM betting_event_types WHERE status = 1 ORDER BY cts DESC'
    const result = await connection.query(query)
    const bettingEventTypes = result.rows
    return res.status(200).json({
      status: 200,
      message: 'Betting event type retrieved successfully.',
      data: bettingEventTypes
    })
  } catch (error) {
    return error500(error, res)
  } finally {
    if (connection) connection.release()
  }
}

module.exports = {
  createBettingEventType,
  getBettingEventTypes,
  getBettingEventType,
  updateBettingEventType,
  onStatusChange,
  getBettingEventTypesWma

}

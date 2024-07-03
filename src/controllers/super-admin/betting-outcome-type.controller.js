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
//create betting outcome type
const createBettingOutcomeType = async (req, res) => {
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
      'SELECT * FROM betting_outcome_types WHERE TRIM(LOWER(name)) = $1 AND sport_id = $2'
    let nameResult = await connection.query(checkNameExist, [
      name.toLowerCase(),
      sport_id
    ])
    if (nameResult.rowCount > 0) {
      return error422('Name already exist.', res)
    }
    //check is record id exist
    let checkRecordIdExist =
      'SELECT * FROM betting_outcome_types WHERE record_id = $1 AND sport_id = $2'
    let recordIdResult = await connection.query(checkRecordIdExist, [
      record_id,
      sport_id
    ])
    if (recordIdResult.rowCount > 0) {
      return error422('Record id already exist.', res)
    }
    //insert betting outcome types table
    const bettingOutcomeTypeQuery =
      'INSERT INTO betting_outcome_types (name, record_id, sport_id, untitled_id) VALUES ($1, $2, $3, $4)'
    await connection.query(bettingOutcomeTypeQuery, [
      name,
      record_id,
      sport_id,
      untitled_id
    ])
    return res.status(200).json({
      status: 200,
      message: 'Betting outcome type created successfully.'
    })
  } catch (error) {
    error500(error, res)
  } finally {
    if (connection) connection.release()
  }
}
//get betting outcome types list...
const getBettingOutcomeTypes = async (req, res) => {
  const { page, perPage, key } = req.query
  let connection
  try {
    connection = await pool.connect()
    let query = `SELECT bo.*, s.sports_name, s.small_name FROM betting_outcome_types bo LEFT JOIN sports s ON s.sport_id = bo.sport_id `
    let countQuery = `SELECT COUNT(*) AS total FROM betting_outcome_types bo LEFT JOIN sports s ON s.sport_id = bo.sport_id `
    if (key) {
      const lowercaseKey = key.toLowerCase().trim()
      if (key === 'activated') {
        query += ' WHERE bo.status = 1'
        countQuery += ' WHERE bo.status = 1'
      } else if (key === 'deactivated') {
        query += ' WHERE bo.status = 0'
        countQuery += ' WHERE bo.status = 0'
      } else {
        query += ` WHERE LOWER(bo.name) LIKE '%${lowercaseKey}%' `
        countQuery += ` WHERE LOWER(bo.name) LIKE '%${lowercaseKey}%' `
      }
    }

    query += ' ORDER BY bo.cts DESC'
    let total = 0
    // Apply pagination if both page and perPage are provided
    if (page && perPage) {
      const totalResult = await connection.query(countQuery)
      total = parseInt(totalResult.rows[0].total)

      const start = (page - 1) * perPage
      query += ` LIMIT '${perPage}' OFFSET '${start}'`
    }
    const result = await connection.query(query)
    const bettingOutcomeTypes = result.rows
    const data = {
      status: 200,
      message: 'Betting outcome types retrieved successfully',
      data: bettingOutcomeTypes
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

//get betting outcome type by id...
const getBettingOutcomeType = async (req, res) => {
  const betting_outcome_type_id = parseInt(req.params.id)

  if (!betting_outcome_type_id) {
    return error422('Betting outcome type id is required.', res)
  }
  let connection
  try {
    connection = await pool.connect()
    let query =
      'SELECT bo.*, s.sports_name, s.small_name FROM betting_outcome_types bo LEFT JOIN sports s ON s.sport_id = bo.sport_id WHERE bo.betting_outcome_type_id = $1'
    const result = await connection.query(query, [betting_outcome_type_id])
    if (result.rowCount === 0) {
      return error422('Betting outcome type is Not Found', res)
    }
    let betting_outcome_types = result.rows[0]
    const data = {
      status: 200,
      message: 'Betting outcome type retrieved successfully',
      data: betting_outcome_types
    }
    return res.status(200).json(data)
  } catch (error) {
    error500(error, res)
  } finally {
    if (connection) connection.release()
  }
}

//update betting outcome type 
const updateBettingOutcomeType = async (req, res) => {
  const betting_outcome_type_id = parseInt(req.params.id)
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
  } else if (!betting_outcome_type_id) {
    return error422('Betting outcome type id is required.', res)
  } else if (!untitled_id) {
    return error422('Untitled id is required.', res)
  }

  let connection
  connection = await pool.connect()
  // check if betting outcome types exists
  const checkBettingOutcomeTypeQuery = 'SELECT * FROM betting_outcome_types WHERE betting_outcome_type_id = $1'
  const checkBettingOutcomeTypeResult = await connection.query(checkBettingOutcomeTypeQuery, [betting_outcome_type_id])
  if (checkBettingOutcomeTypeResult.rowCount === 0) {
    return error422('Betting outcome type is Not Found', res)
  }
  //check is name exist
  const checkBettingOutcomeTypeNameQuery =
    'SELECT * FROM betting_outcome_types WHERE (TRIM(LOWER(name)) = $1 AND sport_id = $2 ) AND betting_outcome_type_id != $3'
  const checkBettingOutcomeTypeNameResult = await connection.query(checkBettingOutcomeTypeNameQuery, [
    name.toLowerCase(),
    sport_id,
    betting_outcome_type_id
  ])
  if (checkBettingOutcomeTypeNameResult.rowCount > 0) {
    return error422('Name is already exist.', res)
  }
  //check is record id  exist
  const checkBettingOutcomeTypeRecordIdQuery =
    'SELECT * FROM betting_outcome_types WHERE (record_id = $1 AND sport_id = $2 ) AND betting_outcome_type_id != $3'
  const checkBettingOutcomeTypeRecordIdResult = await connection.query(checkBettingOutcomeTypeRecordIdQuery, [
    record_id,
    sport_id,
    betting_outcome_type_id
  ])
  if (checkBettingOutcomeTypeRecordIdResult.rowCount > 0) {
    return error422('Record id is already exist.', res)
  }
  try {
    //update the betting outcome type record with new data
    const updateQuery = `
      UPDATE betting_outcome_types
      SET name = $1, sport_id = $2, record_id = $3, untitled_id =$4
      WHERE betting_outcome_type_id = $5
      `
    const updateResult = await connection.query(updateQuery, [
      name,
      sport_id,
      record_id,
      untitled_id,
      betting_outcome_type_id
    ])

    return res.status(200).json({
      status: 200,
      message: 'Betting outcome type updated successfully.'
    })
  } catch (error) {
    return error500(error, res)
  } finally {
    if (connection) connection.release()
  }
}
//betting outcome type status change
const onStatusChange = async (req, res) => {
  const bettingOutcomeTypeId = parseInt(req.params.id)
  const status = parseInt(req.query.status) // Validate and parse the status parameter
  let connection
  connection = await pool.connect()
  try {
    // Check if the betting outcome type exists
    const bettingOutcomeTypeQuery = 'SELECT * FROM betting_outcome_types WHERE betting_outcome_type_id = $1'
    const bettingOutcomeTypeResult = await connection.query(bettingOutcomeTypeQuery, [bettingOutcomeTypeId])

    if (bettingOutcomeTypeResult.rowCount === 0) {
      return res.status(404).json({
        status: 404,
        message: 'Betting outcome type not found.'
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
            UPDATE betting_outcome_types
            SET status = $1
            WHERE betting_outcome_type_id = $2
        `

    await connection.query(updateQuery, [status, bettingOutcomeTypeId])

    const statusMessage = status === 1 ? 'activated' : 'deactivated'

    return res.status(200).json({
      status: 200,
      message: `Betting outcome type ${statusMessage} successfully.`
    })
  } catch (error) {
    return error500(error, res)
  } finally {
    if (connection) connection.release()
  }
}
//get betting outcome types Wma...
const getBettingOutcomeTypesWma = async (req, res) => {
  let connection
  connection = await pool.connect()
  try {
    let query = 'SELECT * FROM betting_outcome_types WHERE status = 1 ORDER BY cts DESC'
    const result = await connection.query(query)
    const bettingOutcomeTypes = result.rows
    return res.status(200).json({
      status: 200,
      message: 'Betting outcome type retrieved successfully.',
      data: bettingOutcomeTypes
    })
  } catch (error) {
    return error500(error, res)
  } finally {
    if (connection) connection.release()
  }
}

module.exports = {
  createBettingOutcomeType,
  getBettingOutcomeTypes,
  getBettingOutcomeType,
  updateBettingOutcomeType,
  onStatusChange,
  getBettingOutcomeTypesWma

}

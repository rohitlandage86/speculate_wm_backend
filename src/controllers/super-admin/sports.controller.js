const pool = require('../../../db')
const fs = require('fs') // Required for file system operations
const path = require('path') // Required for working with file paths
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

//create sport...
const createSport = async (req, res) => {
  const sports_name = req.body.sports_name ? req.body.sports_name.trim() : ''
  const small_name = req.body.small_name ? req.body.small_name.trim() : ''
  const api_keys = req.body.api_keys ? req.body.api_keys.trim() : ''
  const description = req.body.description ? req.body.description.trim() : ''
  const untitled_id = req.companyData?.untitled_id
  const logo1Name = req.body.logo1Name ? req.body.logo1Name.trim() : ''
  const logo1Base64 = req.body.logo1Base64 ? req.body.logo1Base64.trim() : ''

  if (!sports_name) {
    return error422('Sport name is required.', res)
  } else if (!small_name) {
    return error422('Small name is required.', res)
  } else if (!api_keys) {
    return error422('Api key is required.', res)
  } else if (!untitled_id) {
    return error422('Untitled id is required.', res)
  } else if (!logo1Name || !logo1Base64) {
    return error422('Logo 1 is required.', res)
  }
  // Generate logo1FileName and logo1FilePath if logo1Name provided
  let logo1FileName = ''
  let logo1FilePath = ''
  if (logo1Name && logo1Base64) {
    const timestamp = Date.now()
    const fileExtension = path.extname(logo1Name)
    logo1FileName = `${sports_name}_${timestamp}${fileExtension}`
    logo1FilePath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'images',
      'sports',
      logo1FileName
    )

    const decodedLogo = Buffer.from(logo1Base64, 'base64')
    fs.writeFileSync(logo1FilePath, decodedLogo)
  }

  let connection
  try {
    connection = await pool.connect()
    //check is sport name exist
    let checkSportNameQuery =
      'SELECT * FROM sports WHERE TRIM(LOWER(sports_name)) = $1'
    let checkSportNameResult = await connection.query(checkSportNameQuery, [
      sports_name.toLowerCase()
    ])
    if (checkSportNameResult.rowCount > 0) {
      if (fs.existsSync(logo1FilePath)) {
        fs.unlinkSync(logo1FilePath)
      }
      return error422('Sport name already exist.', res)
    }
    //check is small name exist
    let checkSmallNameQuery =
      'SELECT * FROM sports WHERE TRIM(LOWER(small_name)) = $1'
    let checkSmallNameResult = await connection.query(checkSmallNameQuery, [
      small_name.toLowerCase()
    ])
    if (checkSmallNameResult.rowCount > 0) {
      if (fs.existsSync(logo1FilePath)) {
        fs.unlinkSync(logo1FilePath)
      }
      return error422('Small name already exist.', res)
    }

    //insert sports table
    const sportQuery =
      'INSERT INTO sports (sports_name, small_name, api_keys, description, untitled_id, image) VALUES ($1, $2, $3, $4, $5, $6)'
    await connection.query(sportQuery, [
      sports_name,
      small_name,
      api_keys,
      description,
      untitled_id,
      logo1FileName
    ])
    res.status(200).json({
      status: 200,
      message: 'Sport created successfully'
    })
  } catch (error) {
    if (fs.existsSync(logo1FilePath)) {
      fs.unlinkSync(logo1FilePath)
    }
    error500(error, res)
  } finally {
    if (connection) connection.release()
  }
}
//get sports list...
const getSports = async (req, res) => {
  const { page, perPage, key } = req.query
  let connection
  try {
    connection = await pool.connect()
    let query = 'SELECT * FROM sports'
    let countQuery = 'SELECT COUNT(*) AS total FROM sports'
    if (key) {
      const lowercaseKey = key.toLowerCase().trim()
      if (key === 'activated') {
        query += ' WHERE status = 1'
        countQuery += ' WHERE status = 1'
      } else if (key === 'deactivated') {
        query += ' WHERE status = 0'
        countQuery += ' WHERE status = 0'
      } else {
        query += ` WHERE LOWER(sports_name) LIKE '%${lowercaseKey}%'`
        countQuery += ` WHERE LOWER(sports_name) LIKE '%${lowercaseKey}%'`
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
      message: 'Sports retrieved successfully',
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
    if (connection) {
      await connection.release()
    }
  }
}
//get sport by id...
const getSport = async (req, res) => {
  const sport_id = parseInt(req.params.id)

  if (!sport_id) {
    return error422('Sport id is required.', res)
  }
  let connection
  try {
    connection = await pool.connect()
    let query = 'SELECT * FROM sports WHERE sport_id = $1'
    const result = await connection.query(query, [sport_id])
    if (result.rowCount === 0) {
      return error422('Sport is Not Found', res)
    }
    let  sport = result.rows[0]
        // Read the image file and convert it to base64
        const logo1FilePath = path.join(
          __dirname,
          '..',
          '..',
          '..',
          'images',
          'sports',
          sport.image
        );
    
        let logo1Base64 = '';
        if (fs.existsSync(logo1FilePath)) {
          const logo1Buffer = fs.readFileSync(logo1FilePath);
          logo1Base64 = logo1Buffer.toString('base64');
        }
        sport.base64 = logo1Base64
    const data = {
      status: 200,
      message: 'Sport retrieved successfully',
      data: sport
    }
    return res.status(200).json(data)
  } catch (error) {
    error500(error, res)
  } finally {
    if (connection) {
      connection.release()
    }
  }
}

//update sport
const updateSport = async (req, res) => {
  const sport_id = parseInt(req.params.id)
  const sports_name = req.body.sports_name ? req.body.sports_name.trim() : ''
  const small_name = req.body.small_name ? req.body.small_name.trim() : ''
  const api_keys = req.body.api_keys ? req.body.api_keys.trim() : ''
  const description = req.body.description ? req.body.description.trim() : ''
  const untitled_id = req.companyData.untitled_id
  const logo1Name = req.body.logo1Name ? req.body.logo1Name.trim() : ''
  const logo1Base64 = req.body.logo1Base64 ? req.body.logo1Base64.trim() : '' 

  if (!sport_id) {
    return error422('Sport Id is required.', res)
  } else if (!sports_name) {
    return error422('Sport name is required.', res)
  } else if (!small_name) {
    return error422('Small name is required .', res)
  } else if (!api_keys) {
    return error422('API Key is required.', res)
  } else if (!untitled_id) {
    return error422('Untitled id is required.', res)
  } else if (!logo1Name || !logo1Base64) {
    return error422('Logo 1 is required.', res)
  }
    // Generate logo1FileName and logo1FilePath if logo1Name provided
    let logo1FileName = ''
    let logo1FilePath = ''
    if (logo1Name && logo1Base64) {
      const timestamp = Date.now()
      const fileExtension = path.extname(logo1Name)
      logo1FileName = `${sports_name}_${timestamp}${fileExtension}`
      logo1FilePath = path.join(
        __dirname,
        '..',
        '..',
        '..',
        'images',
        'sports',
        logo1FileName
      )
  
      const decodedLogo = Buffer.from(logo1Base64, 'base64')
      fs.writeFileSync(logo1FilePath, decodedLogo)
    }
  
  let connection
  connection = await pool.connect()
  // check if sport exists
  const checkSportQuery = 'SELECT * FROM sports WHERE sport_id = $1'
  const checkSportResult = await connection.query(checkSportQuery, [sport_id])
  if (checkSportResult.rowCount === 0) {
    if (fs.existsSync(logo1FilePath)) {
      fs.unlinkSync(logo1FilePath)
    }
    return error422('Sport is Not Found', res)
  }
  //check is sport name exist
  const checkSportNameQuery =
    'SELECT * FROM sports WHERE TRIM(LOWER(sports_name)) = $1 AND sport_id != $2'
  const checkSportNameResult = await connection.query(checkSportNameQuery, [
    sports_name.toLowerCase(),
    sport_id
  ])
  if (checkSportNameResult.rowCount > 0) {
    if (fs.existsSync(logo1FilePath)) {
      fs.unlinkSync(logo1FilePath)
    }
    return error422('Sport name is already exist.', res)
  }
  //check is small name exist
  const checkSmallNameQuery =
    'SELECT * FROM sports WHERE TRIM(LOWER(small_name)) = $1 AND sport_id != $2'
  const checkSmallNameResult = await connection.query(checkSmallNameQuery, [
    small_name.toLowerCase(),
    sport_id
  ])
  if (checkSmallNameResult.rowCount > 0) {
    if (fs.existsSync(logo1FilePath)) {
      fs.unlinkSync(logo1FilePath)
    }
    return error422('Small name is already exist.', res)
  }
  try {
    //update the sport record with new data
    const updateQuery = `
    UPDATE sports
    SET sports_name = $1, small_name = $2, api_keys = $3, description = $4, untitled_id =$5, image = $6
    WHERE sport_id = $7
    `
    const updateResult = await connection.query(updateQuery, [
      sports_name,
      small_name,
      api_keys,
      description,
      untitled_id,
      logo1FileName,
      sport_id
    ])
    if (checkSportResult.rows[0].image) {
            // Delete the old image if it exists
            const oldLogoFilePath = path.join(
              __dirname,
              '..',
              '..',
              '..',
              'images',
              'sports',
              checkSportResult.rows[0].image
            );
            if (fs.existsSync(oldLogoFilePath)) {
              fs.unlinkSync(oldLogoFilePath);
            }
    }
    return res.status(200).json({
      status: 200,
      message: 'Sport updated successfully.'
    })
  } catch (error) {
    if (fs.existsSync(logo1FilePath)) {
      fs.unlinkSync(logo1FilePath)
    }
    return error500(error, res)
  } finally {
    if (connection) {
      connection.release()
    }
  }
}
//sport status change
const onStatusChange = async (req, res) => {
  const sportId = parseInt(req.params.id)
  const status = parseInt(req.query.status) // Validate and parse the status parameter
  let connection
  connection = await pool.connect()
  try {
    // Check if the sport exists
    const sportQuery = 'SELECT * FROM sports WHERE sport_id = $1'
    const sportResult = await connection.query(sportQuery, [sportId])

    if (sportResult.rowCount === 0) {
      return res.status(404).json({
        status: 404,
        message: 'Sport not found.'
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

    // Soft update the Sport status
    const updateQuery = `
          UPDATE sports
          SET status = $1
          WHERE sport_id = $2
      `

    await connection.query(updateQuery, [status, sportId])

    const statusMessage = status === 1 ? 'activated' : 'deactivated'

    return res.status(200).json({
      status: 200,
      message: `Sport ${statusMessage} successfully.`
    })
  } catch (error) {
    return error500(error, res)
  } finally {
    if (connection) {
      connection.release()
    }
  }
}
//get sports Wma...
const getSportsWma = async (req, res) => {
  let connection
  connection = await pool.connect()
  try {
    let query = 'SELECT * FROM sports WHERE status = 1 ORDER BY cts DESC'
    const result = await connection.query(query)
    const sports = result.rows
    return res.status(200).json({
      status: 200,
      message: 'Sports retrieved successfully.',
      data: sports
    })
  } catch (error) {
    return error500(error, res)
  } finally {
    if (connection) connection.release()
  }
}
module.exports = {
  createSport,
  getSports,
  getSport,
  updateSport,
  onStatusChange,
  getSportsWma
}

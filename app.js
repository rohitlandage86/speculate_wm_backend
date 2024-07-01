const express = require('express')
const bodyParser = require('body-parser')
const app = express()

const superAdminRoute = require('./src/routes/super-admin/super-admin.routes')
const organizationRoutes = require('./src/routes/super-admin/organization.routes')
const organizationUserRoutes = require('./src/routes/super-admin/organization-user.routes')
const sportsRoutes = require('./src/routes/super-admin/sports.routes')
const stateRoutes = require('./src/routes/super-admin/state.routes')
const configurationRoutes = require('./src/routes/super-admin/configuration.routes')
const gamblerRoutes = require('./src/routes/gambler/gambler.routes')
const bettingEventTypeRoutes = require('./src/routes/super-admin/betting-event-type.routes')
const bettingOutcomeTypeRoutes = require('./src/routes/super-admin/betting-outcome-type.routes')
const bettingPeriodTypeRoutes = require('./src/routes/super-admin/betting-period-type.routes')
const bettingMarketTypeRoutes = require('./src/routes/super-admin/betting-market-type.routes')
const bettingBetTypeRoutes = require('./src/routes/super-admin/betting-bet-type.routes')
const bettingMarketRoutes = require('./src/routes/super-admin/betting-market.routes')

const path = require('path')
app.use(express.json({ limit: '50mb' }))

app.use(
  '/images/logo1',
  express.static(path.join(__dirname, 'images', 'logo1'))
)
app.use(
  '/images/logo2',
  express.static(path.join(__dirname, 'images', 'logo2'))
)
app.use(
  '/images/sports',
  express.static(path.join(__dirname, 'images', 'sports'))
)
app.use(bodyParser.json())
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin,X-Requested-With,Content-Type,Accept, Authorization'
  )
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,POST,PATCH,PUT,DELETE,OPTIONS'
  )
  next()
})

//new routes
app.use('/v1/api/super-admin', superAdminRoute)
app.use('/v1/api/organization', organizationRoutes)
app.use('/v1/api/organization-user', organizationUserRoutes)
app.use('/v1/api/sports', sportsRoutes)
app.use('/v1/api/state', stateRoutes)
app.use('/v1/api/configuration', configurationRoutes)
app.use('/v1/api/gambler', gamblerRoutes)
app.use('/v1/api/betting-event-type', bettingEventTypeRoutes)
app.use('/v1/api/betting-outcome-type', bettingOutcomeTypeRoutes)
app.use('/v1/api/betting-period-type', bettingPeriodTypeRoutes)
app.use('/v1/api/betting-market-type', bettingMarketTypeRoutes)
app.use('/v1/api/betting-bet-type', bettingBetTypeRoutes)
app.use('/v1/api/betting-market', bettingMarketRoutes)

app.get('/', (req, res) => {
  res.send('Welcome to speculate Api')
})
module.exports = app

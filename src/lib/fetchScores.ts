const cheerio = require('cheerio')

export async function fetchScores(sport: 'mlb' | 'nba' | 'nfl') {
  const url = `https://www.espn.com/${sport}/scoreboard`
  const website = await fetch(url)
    .then((res: any) => res.text())
    .then((body: any) => body)

  const $ = cheerio.load(website)
  const scripts = await $('script').toArray()

  const scoreboardScript = scripts.find(
    (script: any) =>
      script.children[0] &&
      script.children[0].data.includes('window.espn.scoreboardData')
  ).children[0].data

  const strippedData = scoreboardScript
    .replace('window.espn.scoreboardData', '')
    .replace('=', '')
    .replace(
      'if(!window.espn_ui.device.isMobile){window.espn.loadType = "ready"};',
      ''
    )
    .replace(/;/g, '')
    .split('window.espn.scoreboardSettings')[0]
    .trim()

  const data = JSON.parse(strippedData)

  const { events } = data

  let scores: any[] = []
  events.map((event: any) => {
    const { competitions, date, shortName, status } = event

    const home = competitions[0].competitors.find(
      (team: any) => team.homeAway === 'home'
    )
    const away = competitions[0].competitors.find(
      (team: any) => team.homeAway === 'away'
    )
    delete home.team.links
    delete home.team.uid
    delete home.team.id
    delete away.team.links
    delete away.team.uid
    delete away.team.id

    scores = [
      ...scores,
      {
        startTime: date,
        shortName,
        status: {
          inning: status.period,
          state: status.type.state,
          detail: status.type.detail,
          shortDetail: status.type.shortDetail,
          completed: status.type.completed
        },
        teams: {
          awayTeam: {
            ...away.team,
            score: away.score
          },
          homeTeam: {
            ...home.team,
            score: home.score
          }
        }
      }
    ]
  })

  return scores
}

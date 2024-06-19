let expandedMatchInfoContainer = null;
function getMatchHistory() {
  const usernameID = document.getElementById('username-id').value;
  const [username, playerID] = usernameID.split('#');
  getPlayerStats(username, playerID);
  const apiURL = `https://api.henrikdev.xyz/valorant/v3/matches/na/${username}/${playerID}?filter=competitive`;
  fetch(apiURL)
    .then(response => response.json())
    .then(data => {
      const matchHistoryContainer = document.getElementById('match-history-container');
      matchHistoryContainer.innerHTML = '';
      if (data.data.length === 0) {
        const noMatchesMessage = document.createElement('p');
        noMatchesMessage.textContent = 'No competitive matches found for the specified user.';
        matchHistoryContainer.appendChild(noMatchesMessage);
        return;
      }
      const allPlayers = {};
      const fetchMatchDetails = (matchInfoContainer, matchID) => {
        const matchDetailsURL = `https://api.henrikdev.xyz/valorant/v2/match/${matchID}`;
        return fetch(matchDetailsURL)
          .then(response => response.json())
          .then(matchData => {
            const gameLength = matchData.data.metadata.game_length;
            const roundsPlayed = matchData.data.metadata.rounds_played;
            const players = matchData.data.players.all_players;
            const bluePlayers = [];
            const redPlayers = [];
            players.forEach(player => {
              const playerName = player.name;
              const puuid = player.puuid;
              const team = player.team;
              const character = player.character;
              const kills = player.stats.kills;
              const deaths = player.stats.deaths;
              const assists = player.stats.assists;
              const kdaRatio = deaths === 0 ? kills.toFixed(1) : (kills / deaths).toFixed(1);
              const headshots = player.stats.headshots || 0;
              const bodyshots = player.stats.bodyshots || 0;
              const legshots = player.stats.legshots || 0;
              let headshotRate = 0;
              let bodyshotRate = 0;
              let legshotRate = 0;
              if (headshots + bodyshots + legshots > 0) {
                headshotRate = ((headshots / (headshots + bodyshots + legshots)) * 100).toFixed(1);
                bodyshotRate = ((bodyshots / (headshots + bodyshots + legshots)) * 100).toFixed(1);
                legshotRate = ((legshots / (headshots + bodyshots + legshots)) * 100).toFixed(1);
              }
              if (team.toLowerCase() === 'blue') {
                bluePlayers.push({
                  puuid: puuid,
                  name: playerName,
                  character: character,
                  kills: kills,
                  deaths: deaths,
                  assists: assists,
                  kdaRatio: kdaRatio,
                  headshotRate: headshotRate,
                  bodyshotRate: bodyshotRate,
                  legshotRate: legshotRate,
                  team: team
                });
              } else if (team.toLowerCase() === 'red') {
                redPlayers.push({
                  puuid: puuid,
                  name: playerName,
                  character: character,
                  kills: kills,
                  deaths: deaths,
                  assists: assists,
                  kdaRatio: kdaRatio,
                  headshotRate: headshotRate,
                  bodyshotRate: bodyshotRate,
                  legshotRate: legshotRate,
                  team: team
                });
              }
              const playerKey = `${playerName}`;
              if (allPlayers[playerKey]) {
                allPlayers[playerKey].push(matchID);
              } else {
                allPlayers[playerKey] = [matchID];
              }
            });
            const blueTeamContainer = createTeamContainer(bluePlayers, 'Blue Team');
            matchInfoContainer.appendChild(blueTeamContainer);

            const redTeamContainer = createTeamContainer(redPlayers, 'Red Team');
            matchInfoContainer.appendChild(redTeamContainer);

            matchHistoryContainer.appendChild(matchInfoContainer);
          });
      };
      const fetchMatchInfo = match => {
        if (match.metadata.mode.toLowerCase() !== 'competitive') {
          return Promise.resolve();
        }
        const mapName = match.metadata.map;
        const matchID = match.metadata.matchid;
        const matchInfoContainer = document.createElement('div');
        matchInfoContainer.classList.add('match-info', 'collapsed');
        const mmrInfoURL = `https://api.henrikdev.xyz/valorant/v1/mmr-history/na/${username}/${playerID}`;
        return fetch(mmrInfoURL)
          .then(response => response.json())
          .then(mmrData => {
            const matchIDs = mmrData.data.map(match => match.match_id);
            const mmrChanges = mmrData.data.map(match => (match.mmr_change_to_last_game > 0 ? 'win' : 'loss'));
            const matchIndex = matchIDs.indexOf(matchID);
            if (matchIndex !== -1) {
              const mmrChange = mmrChanges[matchIndex];
              matchInfoContainer.classList.add(mmrChange);
            }
            const mapHeading = document.createElement('h2');
            mapHeading.textContent = `${mapName}`;
            matchInfoContainer.appendChild(mapHeading);
            matchInfoContainer.addEventListener('click', () => {
              matchInfoContainer.classList.toggle('collapsed');
            });
            return fetchMatchDetails(matchInfoContainer, matchID)
              .catch(error => {
                console.error('Error:', error);
              });
          })
          .catch(error => {
            console.error('Error:', error);
          });
      };
      const matchPromises = data.data.reverse()
        .filter(match => match.metadata.mode.toLowerCase() === 'competitive')
        .map(fetchMatchInfo);
      Promise.all(matchPromises)
        .then(() => {
          const duplicatePlayers = Object.entries(allPlayers).filter(([playerKey, matchIDs]) => matchIDs.length > 1);
          const duplicatePlayersList = document.getElementById('duplicate-players-list');
          duplicatePlayersList.innerHTML = '';
          console.log(username)
          if (duplicatePlayers.length === 0) {
            const noDuplicatePlayersMessage = document.createElement('p');
            noDuplicatePlayersMessage.textContent = 'No duplicate players found.';
            duplicatePlayersList.appendChild(noDuplicatePlayersMessage);
          } else {
            duplicatePlayers.forEach(([playerKey, matchIDs]) => {
              const capitalizedPlayerKey = playerKey.charAt(0).toUpperCase() + playerKey.slice(1);
              const capitalizedUsername = username.charAt(0).toUpperCase() + username.slice(1);
              if (!capitalizedPlayerKey.includes(capitalizedUsername)) {
                const duplicatePlayerItem = document.createElement('li');
                duplicatePlayerItem.textContent = capitalizedPlayerKey;
                duplicatePlayersList.appendChild(duplicatePlayerItem);
              }
            });
          }
        })
        .catch(error => {
          console.error('Error:', error);
        });
    })
    .catch(error => {
      console.error('Error:', error);
    });
}
function getPlayerStats(username, playerID) {
  const apiURL = `https://api.henrikdev.xyz/valorant/v3/matches/na/${username}/${playerID}?filter=competitive`;
  fetch(apiURL)
    .then(response => response.json())
    .then(data => {
      if (data.data.length === 0) {
        const matchHistoryContainer = document.getElementById('match-history-container');
        matchHistoryContainer.innerHTML = '<p>No competitive matches found for the specified user.</p>';
        return;
      }

      const matches = data.data;
      const matchStats = [];

      for (let match of matches) {
        const metadata = match.metadata;
        const players = match.players.all_players;

        for (let player of players) {
          if (player.name === username && player.tag === playerID) {
            const stats = player.stats;
            const roundsPlayed = metadata.rounds_played;
            const damageMade = player.damage_made;
            const bodyshots = stats.bodyshots;
            const headshots = stats.headshots;
            const legshots = stats.legshots;
            const kills = stats.kills;
            const deaths = stats.deaths;
            const assists = stats.assists;

            const adr = damageMade / roundsPlayed;
            const headshotPercentage = (headshots / (bodyshots + headshots + legshots)) * 100;
            const legshotPercentage = (legshots / (bodyshots + headshots + legshots)) * 100;
            const bodyshotPercentage = (bodyshots / (bodyshots + headshots + legshots)) * 100;
            const kdRatio = deaths > 0 ? kills / deaths : kills;

            matchStats.push({
              damageMade: damageMade,
              roundsPlayed: roundsPlayed,
              adr: adr,
              headshotPercentage: headshotPercentage,
              legshotPercentage: legshotPercentage,
              bodyshotPercentage: bodyshotPercentage,
              kdRatio: kdRatio
            });

            break;
          }
        }
      }
      const mmrInfoURL = `https://api.henrikdev.xyz/valorant/v2/mmr/na/${username}/${playerID}`;
      fetch(mmrInfoURL)
        .then(response => response.json())
        .then(mmrData => {
          const highestRankAchieved = mmrData.data.highest_rank.patched_tier;
          const currentRank = mmrData.data.current_data.currenttierpatched;
          const seasonHighestRankAchieved = mmrData.data.highest_rank.season;
          const highestRankAchievedElement = document.getElementById('highest-rank-achieved');
          const currentRankElement = document.getElementById('current-rank');
          const seasonHighestRankElement = document.getElementById('season-highest-rank');
          highestRankAchievedElement.textContent = `Highest: ${highestRankAchieved}`;
          currentRankElement.textContent = `Current: ${currentRank}`;
          seasonHighestRankElement.textContent = `Season: ${seasonHighestRankAchieved}`;
        })
      displayPlayerStats(matchStats);
      calculateAverages(matchStats);
    })
    .catch(error => {
      console.error('Error:', error);
    });
}
function calculateAverages(stats) {
  let totalHeadshotRate = 0;
  let totalBodyshotRate = 0;
  let totalLegshotRate = 0;
  let totalADR = 0;

  for (let stat of stats) {
    totalHeadshotRate += stat.headshotPercentage;
    totalBodyshotRate += stat.bodyshotPercentage;
    totalLegshotRate += stat.legshotPercentage;
    totalADR += stat.adr;
  }

  const numMatches = stats.length;
  const averageHeadshotRate = (totalHeadshotRate / numMatches).toFixed(2);
  const averageBodyshotRate = (totalBodyshotRate / numMatches).toFixed(2);
  const averageLegshotRate = (totalLegshotRate / numMatches).toFixed(2);
  const averageADR = (totalADR / numMatches).toFixed(2);

  console.log('Average Headshot Rate:', averageHeadshotRate + '%');
  console.log('Average Bodyshot Rate:', averageBodyshotRate + '%');
  console.log('Average Legshot Rate:', averageLegshotRate + '%');
  console.log('Average ADR:', averageADR);
}

function displayPlayerStats(stats) {
  const avgHeadshotRate = document.getElementById('avg-headshot-rate');
  const avgKDARatio = document.getElementById('avg-kda-ratio');
  const avgBodyshotRate = document.getElementById('avg-bodyshot-rate');
  const avgLegshotRate = document.getElementById('avg-legshot-rate');
  const avgDamagePerRound = document.getElementById('avg-damage-per-round');

  let totalHeadshotRate = 0;
  let totalKDARatio = 0;
  let totalBodyshotRate = 0;
  let totalLegshotRate = 0;
  let totalDamagePerRound = 0;

  for (let stat of stats) {
    totalHeadshotRate += stat.headshotPercentage;
    totalKDARatio += stat.kdRatio;
    totalBodyshotRate += stat.bodyshotPercentage;
    totalLegshotRate += stat.legshotPercentage;
    totalDamagePerRound += stat.damageMade / stat.roundsPlayed;
  }

  const numMatches = stats.length;
  const averageHeadshotRate = (totalHeadshotRate / numMatches).toFixed(1);
  const averageKDARatio = (totalKDARatio / numMatches).toFixed(1);
  const averageBodyshotRate = (totalBodyshotRate / numMatches).toFixed(1);
  const averageLegshotRate = (totalLegshotRate / numMatches).toFixed(1);
  const averageDamagePerRound = (totalDamagePerRound / numMatches).toFixed(1);

  avgKDARatio.textContent = `KD Ratio: ${(averageKDARatio)}`;
  avgHeadshotRate.textContent = `Headshot: ${(averageHeadshotRate)}%`;
  avgBodyshotRate.textContent = `Bodyshot: ${(averageBodyshotRate)}%`;
  avgLegshotRate.textContent = `Legshot: ${(averageLegshotRate)}%`;
  avgDamagePerRound.textContent = `ADR: ${(averageDamagePerRound)}`;
}

function createPlayerInfoElement(player, index) {
  const playerContainer = document.createElement('div');
  playerContainer.classList.add('player-info');

  const playerName = document.createElement('p');
  playerName.classList.add('player-name');

  const capitalizedPlayerName = player.name.charAt(0).toUpperCase() + player.name.slice(1);
  playerName.innerHTML = `<span class="capitalized">${capitalizedPlayerName}</span> | `;
  playerContainer.appendChild(playerName);

  const playerCharacter = document.createElement('span');
  playerCharacter.textContent = `${player.character}`;
  playerCharacter.classList.add('player-character');
  playerName.appendChild(playerCharacter);

  const playerStats = document.createElement('span');
  playerStats.textContent = ` | ${player.kills}/${player.deaths}/${player.assists}`;
  playerStats.classList.add('player-stats');
  playerName.appendChild(playerStats);

  const teamColorClass = player.team.toLowerCase() === 'blue' ? 'blue' : 'red';
  const shadeClass = index % 2 === 0 ? 'dark' : 'light';
  playerContainer.classList.add(`${teamColorClass}-${shadeClass}`);
  return playerContainer;
}
function createTeamContainer(players, teamName) {
  const teamContainer = document.createElement('div');
  teamContainer.classList.add('team-container');

  const teamHeading = document.createElement('h3');
  teamHeading.textContent = teamName;
  teamContainer.appendChild(teamHeading);

  const teamColorClass = teamName.toLowerCase().replace(' ', '-');
  teamContainer.classList.add(teamColorClass + '-container');

  players.forEach((player, index) => {
    const playerInfo = createPlayerInfoElement(player, index);
    teamContainer.appendChild(playerInfo);
  });
  return teamContainer;
}
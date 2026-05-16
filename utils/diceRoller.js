function rollDice(diceString) {
  // Suporta formatos: "XdY", "XdY+Z", "XdY-Z"
  const match = diceString.match(/(\d*)d(\d+)([+-]\d+)?/i);
  if (!match) return { total: 0, rolls: [], error: "Formato inválido" };
  
  const numDice = parseInt(match[1]) || 1;
  const diceSides = parseInt(match[2]);
  const modifier = parseInt(match[3]) || 0;
  
  const rolls = [];
  let total = 0;
  
  for (let i = 0; i < numDice; i++) {
    const roll = Math.floor(Math.random() * diceSides) + 1;
    rolls.push(roll);
    total += roll;
  }
  
  total += modifier;
  
  return { total, rolls, modifier, diceString };
}

function rollD20(modifier = 0) {
  const roll = Math.floor(Math.random() * 20) + 1;
  const total = roll + modifier;
  return { roll, modifier, total };
}
function formatRollResult(result, type = 'dice') {
  if (type === 'd20') {
    return {
      message: `🎲 Rolagem: 1d20 + ${result.modifier}`,
      details: `Resultado: ${result.roll} + ${result.modifier} = ${result.total}`,
      total: result.total,
      isCritical: result.roll === 20,
      isFumble: result.roll === 1
    };
  }
  
  return {
    message: `🎲 Rolagem: ${result.diceString}`,
    details: `Dados: ${result.rolls.join(' + ')} ${result.modifier !== 0 ? ` ${result.modifier > 0 ? '+' : ''}${result.modifier}` : ''} = ${result.total}`,
    total: result.total,
    rolls: result.rolls,
    modifier: result.modifier
  };
}

module.exports = { rollDice, rollD20, formatRollResult };
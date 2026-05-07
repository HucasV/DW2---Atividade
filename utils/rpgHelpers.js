// utils/rpgHelpers.js
function calcularCusto(nivel, tipo, modo, temEfeito) {
  let custo = 1; // base para ativas
  if (tipo === 'cura') custo++;
  if (modo === 'area') custo++;
  custo += Math.floor((nivel - 1) / 2);
  if (temEfeito) custo++;
  return { vida: 0, sanidade: custo };
}

function calcularPontosAtributoTotais(nivel) {
  return 21 + (nivel - 1) * 2;
}

function calcularPontosGastos(forca, agilidade, constituicao, intelecto, atencao, estabilidade) {
  return (forca - 1) + (agilidade - 1) + (constituicao - 1) + (intelecto - 1) + (atencao - 1) + (estabilidade - 1);
}

function calcularDano(nivel, tipo) {
  const base = {
    dano: ["1d4", "1d6", "1d8"],
    cura: ["1d6", "1d8", "1d10"],
    area: ["1d4", "1d6", "1d8"]
  };
  if (nivel <= 3) {
    return base[tipo]?.[nivel - 1] || "1d6";
  }
  const extra = nivel - 3;
  const qtd = 1 + Math.ceil(extra / 2);
  const dado = extra % 2 === 1 ? 6 : 8;
  return `${qtd}d${dado}`;
}

module.exports = {
  calcularCusto,
  calcularPontosAtributoTotais,
  calcularPontosGastos,
  calcularDano
};
export type Concept = "for" | "while" | "class" | "polymorphism";

const varNames = ["i","j","k","idx","n","m","row","col"];
const listNames = ["nums","letters","items","arr","values"];
const lettersPool = ["'a'","'b'","'c'","'d'","'e'"];
const rand = <T,>(a:T[])=>a[Math.floor(Math.random()*a.length)];
const rint = (a:number,b:number)=>Math.floor(Math.random()*(b-a+1))+a;
const indent = (n=1)=>"    ".repeat(n);

// ---------- FOR ----------
function for_simple(): string {
  const v = rand(varNames);
  return `for ${v} in range(${rint(3,12)}):\n${indent()}print(${v})`;
}
function for_startStop(): string {
  const v = rand(varNames), s = rint(0,5), e = s + rint(3,10);
  return `for ${v} in range(${s}, ${e}):\n${indent()}print(${v} * ${rint(2,9)})`;
}
function for_step(): string {
  const v = rand(varNames), s = rint(0,4), e = s + rint(8,16), st = rint(2,4);
  return `for ${v} in range(${s}, ${e}, ${st}):\n${indent()}print(${v} // ${rint(2,5)})`;
}
function for_overList(): string {
  const v = rand(varNames), L = rand(listNames);
  const lit = `[${Array.from({length:rint(3,5)},()=>rand(lettersPool)).join(", ")}]`;
  return `${L} = ${lit}\nfor ${v} in ${L}:\n${indent()}print(${v})`;
}
const FOR_BLOCKS = [for_simple, for_startStop, for_step, for_overList];

// ---------- WHILE ----------
function while_countup(): string {
  const v = rand(varNames), e = rint(3,9);
  return `${v} = 0\nwhile ${v} < ${e}:\n${indent()}print(${v})\n${indent()}${v} += 1`;
}
function while_countdown(): string {
  const v = rand(varNames), s = rint(4,10);
  return `${v} = ${s}\nwhile ${v} > 0:\n${indent()}print(${v})\n${indent()}${v} -= 1`;
}
function while_break(): string {
  const v = rand(varNames), e = rint(5,12);
  return `${v} = 0\nwhile True:\n${indent()}if ${v} == ${e}:\n${indent(2)}break\n${indent()}print(${v})\n${indent()}${v} += 1`;
}
const WHILE_BLOCKS = [while_countup, while_countdown, while_break];

// ---------- CLASS ----------
function class_simple(): string {
  const C = "Thing" + rint(1,99), a = rand(varNames), b = rand(varNames), inst = C.toLowerCase();
  return `class ${C}:\n${indent()}def __init__(self, ${a}, ${b}):\n${indent(2)}self.${a} = ${a}\n${indent(2)}self.${b} = ${b}\n${indent()}def total(self):\n${indent(2)}return self.${a} + self.${b}\n\n${inst} = ${C}(${rint(1,9)}, ${rint(1,9)})\nprint(${inst}.total())`;
}
function class_repr(): string {
  const C = "User" + rint(1,99);
  return `class ${C}:\n${indent()}def __init__(self, name):\n${indent(2)}self.name = name\n${indent()}def __repr__(self):\n${indent(2)}return f"<${C} { '{' }self.name{ '}' }>"\n\nu = ${C}("daniel")\nprint(u)`;
}
const CLASS_BLOCKS = [class_simple, class_repr];

// ---------- POLYMORPHISM ----------
function poly_methods(): string {
  const Base = "Shape", A = "Circle", B = "Square";
  return `class ${Base}:\n${indent()}def area(self):\n${indent(2)}raise NotImplementedError\n\nclass ${A}(${Base}):\n${indent()}def __init__(self, r):\n${indent(2)}self.r = r\n${indent()}def area(self):\n${indent(2)}return 3.14 * self.r * self.r\n\nclass ${B}(${Base}):\n${indent()}def __init__(self, s):\n${indent(2)}self.s = s\n${indent()}def area(self):\n${indent(2)}return self.s * self.s\n\ndef show_area(x: ${Base}):\n${indent()}print(x.area())\n\nshow_area(${A}(${rint(1,5)}))\nshow_area(${B}(${rint(1,5)}))`;
}
function poly_duck(): string {
  return `class Duck:\n${indent()}def speak(self):\n${indent(2)}print("quack")\n\nclass Person:\n${indent()}def speak(self):\n${indent(2)}print("hello")\n\ndef talk(x):\n${indent()}x.speak()\n\nfor o in [Duck(), Person()]:\n${indent()}talk(o)`;
}
const POLY_BLOCKS = [poly_methods, poly_duck];

// ---------- Public API ----------
const pickN = (arr: Array<() => string>, n: number) =>
  Array.from({ length: n }, () => rand(arr)()).join("\n\n");

export function generateSnippet(concept: Concept, blocks = 3): string {
  switch (concept) {
    case "for": return pickN(FOR_BLOCKS, blocks);
    case "while": return pickN(WHILE_BLOCKS, blocks);
    case "class": return pickN(CLASS_BLOCKS, blocks);
    case "polymorphism": return pickN(POLY_BLOCKS, blocks);
    default: return pickN(FOR_BLOCKS, blocks);
  }
}

export const ALL_CONCEPTS: Concept[] = ["for","while","class","polymorphism"];
export const label = (c: Concept) =>
  c === "for" ? "For Loops" :
  c === "while" ? "While Loops" :
  c === "class" ? "Classes" : "Polymorphism";

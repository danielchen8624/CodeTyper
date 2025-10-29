// Multi-pack Python snippet generators focused on syntax drills.

export type Concept =
  | "loops"
  | "conditionals"
  | "functions"
  | "exceptions"
  | "comprehensions"
  | "classes"
  | "oop"
  | "typing"
  | "decorators"
  | "io"
  | "regex"
  | "async";

export const CONCEPTS: { id: Concept; label: string }[] = [
  { id: "loops", label: "Loops" },
  { id: "conditionals", label: "Conditionals" },
  { id: "functions", label: "Functions" },
  { id: "exceptions", label: "Exceptions" },
  { id: "comprehensions", label: "Comprehensions" },
  { id: "classes", label: "Classes" },
  { id: "oop", label: "OOP & Inheritance" },
  { id: "typing", label: "Typing" },
  { id: "decorators", label: "Decorators" },
  { id: "io", label: "File I/O" },
  { id: "regex", label: "Regex" },
  { id: "async", label: "Async/await" },
];

const varNames = ["i","j","k","idx","n","m","row","col"];
const listNames = ["nums","letters","items","arr","values"];
const lettersPool = ["'a'","'b'","'c'","'d'","'e'"];
const wordPool = ["alpha","beta","cat","dog","hello","world"];
const rand = <T,>(a:T[])=>a[Math.floor(Math.random()*a.length)];
const rint = (a:number,b:number)=>Math.floor(Math.random()*(b-a+1))+a;
const indent = (n=1)=>"    ".repeat(n);
const choiceBool = () => (Math.random() < 0.5 ? "True" : "False");

// ----- LOOPS (for/while/enumerate/zip/break/continue) -----
const LOOPS = [
  () => { const v=rand(varNames); return `for ${v} in range(${rint(3,12)}):\n${indent()}print(${v})`; },
  () => { const v=rand(varNames), s=rint(0,5), e=s+rint(3,10); return `for ${v} in range(${s}, ${e}):\n${indent()}if ${v} % 2 == 0:\n${indent(2)}continue\n${indent()}print(${v})`; },
  () => { const a=rand(varNames), b=rand(varNames); return `for ${a}, ${b} in zip(range(${rint(3,7)}), range(${rint(3,7)})):\n${indent()}print(${a}+${b})`; },
  () => { const v=rand(varNames), stop=rint(3,8); return `${v}=0\nwhile ${v} <= ${stop}:\n${indent()}print(${v})\n${indent()}${v} += 1`; },
  () => { const v=rand(varNames), stop=rint(4,10); return `${v}=0\nwhile True:\n${indent()}if ${v}==${stop}:\n${indent(2)}break\n${indent()}${v}+=1`; },
  () => { const L=rand(listNames); return `${L}=[${Array.from({length:rint(3,5)},()=>rint(1,9)).join(", ")}]\nfor idx, x in enumerate(${L}):\n${indent()}print(idx, x)`; },
];

// ----- CONDITIONALS (if/elif/else, ternary, match) -----
const CONDITIONALS = [
  () => `x=${rint(0,10)}\nif x<3:\n${indent()}print("low")\nelif x<7:\n${indent()}print("mid")\nelse:\n${indent()}print("high")`,
  () => { const a=rint(1,9), b=rint(1,9); return `a=${a}; b=${b}\nprint("bigger" if a>b else "smaller or equal")`; },
  () => { const w=rand(wordPool); return `v="${w}"\nmatch v:\n${indent()}case "alpha":\n${indent(2)}print(1)\n${indent()}case "beta":\n${indent(2)}print(2)\n${indent()}case _:\n${indent(2)}print(0)`; },
];

// ----- FUNCTIONS (defaults, *args/**kwargs, annotations) -----
const FUNCTIONS = [
  () => `def add(a: int, b: int = ${rint(1,5)}) -> int:\n${indent()}return a + b\n\nprint(add(${rint(1,9)}))`,
  () => `def total(*args: int) -> int:\n${indent()}s = 0\n${indent()}for x in args:\n${indent(2)}s += x\n${indent()}return s\n\nprint(total(1,2,3))`,
  () => `def fmt(name: str, **opts) -> str:\n${indent()}sep = opts.get("sep", "-")\n${indent()}return f"{name}{sep}{len(name)}"\n\nprint(fmt("daniel", sep=":"))`,
];

// ----- EXCEPTIONS (try/except/else/finally, raise) -----
const EXCEPTIONS = [
  () => `try:\n${indent()}x = int("notnum")\nexcept ValueError:\n${indent()}x = -1\nprint(x)`,
  () => `def inv(x):\n${indent()}if x == 0:\n${indent(2)}raise ZeroDivisionError("nope")\n${indent()}return 1/x\n\ntry:\n${indent()}print(inv(${rint(0,2)}))\nfinally:\n${indent()}print("done")`,
  () => `try:\n${indent()}f = open("missing.txt")\nexcept FileNotFoundError as e:\n${indent()}print("missing")\nelse:\n${indent()}print(f.read()); f.close()`,
];

// ----- COMPREHENSIONS (list/set/dict + filters) -----
const COMPREHENSIONS = [
  () => `squares = [x*x for x in range(${rint(4,9)})]\nprint(squares)`,
  () => `evens = {x for x in range(${rint(6,12)}) if x % 2 == 0}\nprint(evens)`,
  () => `d = {c: ord(c) for c in "abcde"}\nprint(d)`,
];

// ----- CLASSES (dunders, properties, class/static methods) -----
const CLASSES = [
  () => `class Box:\n${indent()}def __init__(self, w, h):\n${indent(2)}self.w=w; self.h=h\n${indent()}def area(self):\n${indent(2)}return self.w*self.h\n\nb=Box(${rint(1,5)},${rint(1,5)})\nprint(b.area())`,
  () => `class User:\n${indent()}def __init__(self, name):\n${indent(2)}self._name=name\n${indent()}@property\n${indent()}def name(self):\n${indent(2)}return self._name\n\nu=User("daniel")\nprint(u.name)`,
  () => `class Math:\n${indent()}@staticmethod\n${indent()}def twice(x):\n${indent(2)}return 2*x\n\nprint(Math.twice(${rint(2,9)}))`,
];

// ----- OOP & INHERITANCE (abstract, override, polymorphism) -----
const OOP = [
  () => `class Animal:\n${indent()}def speak(self):\n${indent(2)}raise NotImplementedError\n\nclass Dog(Animal):\n${indent()}def speak(self):\n${indent(2)}print("woof")\n\ndef talk(a: Animal):\n${indent()}a.speak()\n\ntalk(Dog())`,
  () => `class Base:\n${indent()}def value(self):\n${indent(2)}return 1\n\nclass Child(Base):\n${indent()}def value(self):\n${indent(2)}return super().value()+1\n\nprint(Child().value())`,
];

// ----- TYPING (generics, TypedDict/Protocol-ish, unions) -----
const TYPING = [
  () => `from typing import TypeVar, Generic, List\nT = TypeVar("T")\nclass Bag(Generic[T]):\n${indent()}def __init__(self):\n${indent(2)}self.items: List[T] = []\n${indent()}def add(self, x: T) -> None:\n${indent(2)}self.items.append(x)\n\nb=Bag[int](); b.add(3); print(b.items)`,
  () => `from typing import TypedDict\nclass User(TypedDict):\n${indent()}id: int\n${indent()}name: str\n\nu: User = {"id":1,"name":"a"}\nprint(u["name"])`,
  () => `from typing import Union\nx: Union[int,str]\nx = ${rint(0,1)} or "a"\nprint(x)`,
];

// ----- DECORATORS (simple + parametric) -----
const DECORATORS = [
  () => `from functools import wraps\n\ndef log(fn):\n${indent()}@wraps(fn)\n${indent()}def inner(*a,**k):\n${indent(2)}print(fn.__name__)\n${indent(2)}return fn(*a,**k)\n${indent()}return inner\n\n@log\ndef add(a,b):\n${indent()}return a+b\n\nprint(add(1,2))`,
  () => `def times(n):\n${indent()}def deco(fn):\n${indent(2)}def inner(*a,**k):\n${indent(3)}for _ in range(n): fn(*a,**k)\n${indent(2)}return inner\n${indent()}return deco\n\n@times(${rint(2,4)})\ndef hello():\n${indent()}print("hi")\n\nhello()`,
];

// ----- FILE I/O (with, Pathlib) -----
const IO = [
  () => `with open("data.txt","w",encoding="utf-8") as f:\n${indent()}f.write("hello")\n\nwith open("data.txt") as f:\n${indent()}print(f.read())`,
  () => `from pathlib import Path\np=Path("nums.txt")\np.write_text("1 2 3")\nprint(p.read_text())`,
];

// ----- REGEX (compile, groups, substitution) -----
const REGEX = [
  () => `import re\nm=re.findall(r"[a-z]+", "ab12cdEF")\nprint(m)`,
  () => `import re\npat=re.compile(r"(\\d+)-(\\w+)")\nm=pat.search("42-answer")\nprint(m.group(1), m.group(2))`,
  () => `import re\ns=re.sub(r"\\d","*", "a1b2c3")\nprint(s)`,
];

// ----- ASYNC (async/await, gather) -----
const ASYNC = [
  () => `import asyncio\nasync def work(i):\n${indent()}await asyncio.sleep(0)\n${indent()}print(i)\n\nasync def main():\n${indent()}await work(${rint(1,5)})\n\nasyncio.run(main())`,
  () => `import asyncio\nasync def one(x):\n${indent()}await asyncio.sleep(0)\n${indent()}return x\n\nasync def main():\n${indent()}a,b = await asyncio.gather(one(1), one(2))\n${indent()}print(a+b)\n\nasyncio.run(main())`,
];

const pickN = (arr: Array<() => string>, n: number) =>
  Array.from({ length: n }, () => rand(arr)()).join("\n\n");

export function generateSnippet(concept: Concept, blocks = 3): string {
  switch (concept) {
    case "loops":          return pickN(LOOPS, blocks);
    case "conditionals":   return pickN(CONDITIONALS, blocks);
    case "functions":      return pickN(FUNCTIONS, blocks);
    case "exceptions":     return pickN(EXCEPTIONS, blocks);
    case "comprehensions": return pickN(COMPREHENSIONS, blocks);
    case "classes":        return pickN(CLASSES, blocks);
    case "oop":            return pickN(OOP, blocks);
    case "typing":         return pickN(TYPING, blocks);
    case "decorators":     return pickN(DECORATORS, blocks);
    case "io":             return pickN(IO, blocks);
    case "regex":          return pickN(REGEX, blocks);
    case "async":          return pickN(ASYNC, blocks);
    default:               return pickN(LOOPS, blocks);
  }
}

// lib/generators.ts
// Big multi-language snippet generator for syntax drills.
// Languages: Python, JavaScript, TypeScript, Java, C.

export type Lang = "python" | "javascript" | "typescript" | "java" | "c";
export const LANGS: { id: Lang; label: string }[] = [
  { id: "python", label: "Python" },
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "java", label: "Java" },
  { id: "c", label: "C" },
];

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

type Bank = Record<Concept, Array<() => string>>;
const EMPTY: Array<() => string> = [];

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

// -------------- shared utils + big pools --------------
const rand = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const rint = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
const indent = (n = 1) => "    ".repeat(n);

// identifier helpers
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

const varNames = [
  "i","j","k","idx","n","m","row","col","x","y","z","u","v",
  "count","total","sum","avg","min","max","flag","temp","pos","neg","left","right","low","high",
  "start","end","from","to","len","cap","width","height","depth","radius","speed","angle",
  "score","level","rank","seed","salt","hash","year","month","day","ts",
  "user","admin","owner","sender","buyer","seller","client","server","job","task","queue","event",
  "token","session","cache","cursor","page","node","edge","key","val","entry","item","elem",
  "lion","tiger","bear","fox","wolf","owl","eagle","otter","yak","zebra",
  "tree","oak","maple","willow","river","lake","stone","mountain","desert",
  "alphaIdx","betaIdx","pivot","center","root","leaf","child","parent","neighbor",
  "loss","acc","theta","gammaParam","lambda","sigma","price","yield","margin","spread",
  "ion","dc","pac"
];

const listNames = [
  "nums","values","items","data","arr","list","queue","stack","heap","bag","set","pool",
  "records","rows","cols","letters","chars","words","tokens","lines","sentences","pages",
  "users","orders","products","clients","events","tasks","jobs","messages","nodes","edges","paths",
  "keys","vals","pairs","entries","fields","frames","tuples",
  "animals","birds","fish","trees","fruits","colors","planets","moons","stars",
  "samples","scores","ranks","levels","buckets","bins","windows","segments","chunks","groups",
  "years","months","days","hours","minutes","seconds","timestamps",
  "inbox","outbox","history","backlog","todo","doing","done","archive",
  "primes","evens","odds","fibs","triangles","squares",
  "imports","exports","modules","plugins","hooks","middlewares","handlers","controllers","views","models",
  "ionTrains","dcRooms","pacSlots"
];

const words = [
  "alpha","beta","gamma","delta","omega","hello","world","lorem","ipsum","aurora","breeze","cascade","ember",
  "harmony","nebula","overture","prism","quartz","serenity","solace","spectrum","starlight","velocity","zen",
  "ant","badger","bear","bee","bison","boar","butterfly","camel","cat","cheetah","chicken","cobra","cow",
  "coyote","crab","crane","crow","deer","dog","dolphin","donkey","duck","eagle","eel","elephant","elk","falcon",
  "ferret","flamingo","fox","frog","gazelle","giraffe","goat","goose","gorilla","hamster","hawk","hedgehog",
  "hippo","horse","hyena","iguana","jaguar","jellyfish","kangaroo","koala","lemur","leopard","lion","llama","lobster",
  "lynx","magpie","mole","monkey","moose","moth","mouse","narwhal","octopus","otter","owl","ox","oyster",
  "panda","panther","parrot","pelican","penguin","pigeon","puma","quail","rabbit","raccoon","ray","reindeer","rhino",
  "robin","salamander","seal","shark","sheep","shrimp","skunk","sloth","snail","snake","sparrow","spider","squid",
  "swan","tapir","tiger","toad","turkey","turtle","vulture","walrus","wasp","weasel","whale","wolf","wombat","yak","zebra",
];

const choose = rand;
const pickVar = () => choose(varNames);
const pickList = () => choose(listNames);
const pickWord = () => choose(words);
const pickFuncName = () =>
  choose([
    "add","sum","merge","calc","combine","apply","map","reduce","filter","accumulate",
    "process","handle","compute","update","transform","fold","scan","pair","zip","unzip",
    "peek","take","drop","chunk","window","group","rank","score","hash","encode","decode",
    "fizz","peak","total"
  ]);
const pickMethodName = () =>
  choose([
    "get","set","push","pop","peek","size","len","area","perimeter","value","count","mean","min","max","sum","inc","dec",
    "clear","add","remove","has","contains","print","log","speak","move","draw","render","connect","close"
  ]);
const pickProp = () =>
  choose([
    "x","y","z","w","h","r","g","b","id","name","age","score","count","size","len","width","height","depth","radius","angle",
    "speed","left","right","top","bottom","row","col","from","to"
  ]);
const pickClassName = () => cap(pickWord());

// quick helpers
const arrOfNums = (n: number, a = 1, b = 9) =>
  Array.from({ length: n }, () => rint(a, b)).join(", ");
const someWords = (n: number) =>
  Array.from({ length: n }, () => `"${pickWord()}"`).join(", ");

// pad a template list up to at least k by wrapping
const ensureCount = (arr: Array<() => string>, k = 10) => {
  if (arr.length >= k) return arr;
  const out = [...arr];
  let idx = 0;
  while (out.length < k) {
    const base = arr[idx % arr.length];
    out.push(() => base());
    idx++;
  }
  return out;
};

// -------------- PYTHON --------------
const PY = {
  LOOPS: ensureCount([
    () => { const v = pickVar(); return `for ${v} in range(${rint(3, 12)}):\n${indent()}print(${v})`; },
    () => { const v=pickVar(), s=rint(0,5), e=s+rint(3,10); return `for ${v} in range(${s}, ${e}):\n${indent()}if ${v} % 2 == 0:\n${indent(2)}continue\n${indent()}print(${v})`; },
    () => { const a=pickVar(), b=pickVar(); return `for ${a}, ${b} in zip(range(${rint(3,7)}), range(${rint(3,7)})):\n${indent()}print(${a}+${b})`; },
    () => { const v=pickVar(), stop=rint(3,8); return `${v}=0\nwhile ${v} <= ${stop}:\n${indent()}print(${v})\n${indent()}${v} += 1`; },
    () => { const v=pickVar(), stop=rint(4,10); return `${v}=0\nwhile True:\n${indent()}if ${v}==${stop}:\n${indent(2)}break\n${indent()}${v}+=1`; },
    () => { const L=pickList(); return `${L}=[${arrOfNums(rint(3,6))}]\nfor idx, x in enumerate(${L}):\n${indent()}if idx==${rint(1,3)}: break\n${indent()}print(idx, x)`; },
    () => { const L=pickList(); return `${L}=[${someWords(rint(3,6))}]\nfor s in ${L}:\n${indent()}if "a" in s:\n${indent(2)}continue\n${indent()}print(s.upper())`; },
    () => { const L=pickList(), v=pickVar(); return `${L}=[${arrOfNums(5)}]\nfor ${v} in ${L}:\n${indent()}print(${v}**2)`; },
    () => { const A=pickList(), B=pickList(); return `${A}=[${arrOfNums(3)}]; ${B}=[${arrOfNums(3)}]\nfor a in ${A}:\n${indent()}for b in ${B}:\n${indent(2)}print(a*b)`; },
    () => { const L=pickList(); return `${L}=[${arrOfNums(6)}]\nfor i, v in enumerate(${L}):\n${indent()}print(i, v if v%2==0 else -v)`; },
  ]),
  CONDITION: ensureCount([
    () => `x=${rint(0,10)}\nif x<3:\n${indent()}print("low")\nelif x<7:\n${indent()}print("mid")\nelse:\n${indent()}print("high")`,
    () => { const a=rint(1,9), b=rint(1,9); return `a=${a}; b=${b}\nprint("bigger" if a>b else "smaller or equal")`; },
    () => `s="${pickWord()}"\nprint("yes" if s.startswith("a") else "no")`,
    () => `n=${rint(1,9)}\nprint("even" if n%2==0 else "odd")`,
    () => { const v=pickVar(); return `${v}=${rint(0,1)}\nif ${v}:\n${indent()}print("on")\nelse:\n${indent()}print("off")`; },
    () => { const a=pickVar(), b=pickVar(); return `${a}=${rint(1,9)}; ${b}=${rint(1,9)}\nprint("eq" if ${a}==${b} else "neq")`; },
    () => { const s=pickVar(); return `${s}="${pickWord()}"\nprint(${s}.upper() if len(${s})>${rint(2,6)} else ${s}.lower())`; },
    () => `x=${rint(1,9)}\nprint("div3" if x%3==0 else ("div2" if x%2==0 else "other"))`,
    () => { const L=pickList(); return `${L}=[${arrOfNums(4)}]\nprint("nonempty" if ${L} else "empty")`; },
    () => { const v=pickVar(); return `${v}=${rint(0,10)}\nif 2<=${v}<=5:\n${indent()}print("mid")\nelse:\n${indent()}print("edge")`; },
  ]),
  FUNC: ensureCount([
    () => { const f=pickFuncName(); return `def ${f}(a: int, b: int = ${rint(1,5)}) -> int:\n${indent()}return a + b\n\nprint(${f}(${rint(1,9)}))`; },
    () => { const f=pickFuncName(); return `def ${f}(*args: int) -> int:\n${indent()}s = 0\n${indent()}for x in args:\n${indent(2)}s += x\n${indent()}return s\n\nprint(${f}(${arrOfNums(3)}))`; },
    () => { const f=pickFuncName(); return `def ${f}(arr):\n${indent()}return max(arr) if arr else None\n\nprint(${f}([${arrOfNums(5)}]))`; },
    () => { const f="fizz"; return `def ${f}(n):\n${indent()}return "FizzBuzz" if n%15==0 else ("Fizz" if n%3==0 else ("Buzz" if n%5==0 else n))\n\nprint([${f}(x) for x in range(1,16)])`; },
    () => { const f=pickFuncName(), g=pickFuncName(); return `def ${f}(x): return x*x\n\ndef ${g}(xs):\n${indent()}return [${f}(x) for x in xs]\n\nprint(${g}([${arrOfNums(4)}]))`; },
    () => { const f=pickFuncName(); return `def ${f}(d: dict):\n${indent()}return {k:v for k,v in d.items() if v%2==0}\n\nprint(${f}({i:i for i in [${arrOfNums(6)}]}))`; },
    () => { const f=pickFuncName(); return `def ${f}(s: str) -> bool:\n${indent()}return s.isalpha()\n\nprint(${f}("${pickWord()}"))`; },
    () => { const f=pickFuncName(); return `def ${f}(x: int) -> int:\n${indent()}if x<=1: return 1\n${indent()}return x*${f}(x-1)\n\nprint(${f}(${rint(3,6)}))`; },
    () => { const f=pickFuncName(); return `def ${f}(xs):\n${indent()}acc=0\n${indent()}for x in xs: acc+=x\n${indent()}return acc\n\nprint(${f}([${arrOfNums(5)}]))`; },
    () => { const f=pickFuncName(); return `def ${f}(xs): return list(reversed(xs))\nprint(${f}([${arrOfNums(5)}]))`; },
  ]),
  EXC: ensureCount([
    () => `try:\n${indent()}x = int("notnum")\nexcept ValueError:\n${indent()}x = -1\nprint(x)`,
    () => `def inv(x):\n${indent()}if x == 0:\n${indent(2)}raise ZeroDivisionError("nope")\n${indent()}return 1/x\n\ntry:\n${indent()}print(inv(${rint(0,2)}))\nfinally:\n${indent()}print("done")`,
    () => `try:\n${indent()}open("missing.txt")\nexcept FileNotFoundError:\n${indent()}print("missing")\nelse:\n${indent()}print("ok")`,
    () => `try:\n${indent()}[1,2,3].index(9)\nexcept ValueError as e:\n${indent()}print("err")`,
    () => `try:\n${indent()}d={}\n${indent()}print(d["x"])\nexcept KeyError:\n${indent()}print("no key")`,
    () => `try:\n${indent()}1/0\nexcept ZeroDivisionError as e:\n${indent()}print("zero")`,
    () => `try:\n${indent()}import no_such_module\nexcept Exception as e:\n${indent()}print("import fail")`,
    () => `try:\n${indent()}int(None)\nexcept TypeError:\n${indent()}print("type")`,
    () => `try:\n${indent()}raise RuntimeError("boom")\nexcept RuntimeError as e:\n${indent()}print(str(e))`,
    () => `try:\n${indent()}assert ${rint(0,1)}\nexcept AssertionError:\n${indent()}print("assert")`,
  ]),
  COMP: ensureCount([
    () => `squares = [x*x for x in range(${rint(4,9)})]\nprint(squares)`,
    () => `evens = {x for x in range(${rint(6,12)}) if x % 2 == 0}\nprint(evens)`,
    () => `d = {c: ord(c) for c in "abcde"}\nprint(d)`,
    () => `pairs=[(x,y) for x in range(3) for y in range(2)]\nprint(pairs)`,
    () => `caps=[w.upper() for w in [${someWords(5)}] if "a" in w]\nprint(caps)`,
    () => `triples=[x for x in range(${rint(5,12)}) if x%3==0]\nprint(triples)`,
    () => `mat=[ [i*j for j in range(3)] for i in range(3) ]\nprint(mat)`,
    () => `flatten=[x for row in [[1,2],[3,4]] for x in row]\nprint(flatten)`,
    () => `idx={w:i for i,w in enumerate([${someWords(5)}])}\nprint(idx)`,
    () => `unique={w[0] for w in [${someWords(6)}]}\nprint(unique)`,
  ]),
  CLASS: ensureCount([
    () => { const C=pickClassName(), w=pickProp(), h=pickProp(); return `class ${C}:\n${indent()}def __init__(self, ${w}, ${h}):\n${indent(2)}self.${w}=${w}; self.${h}=${h}\n${indent()}def area(self):\n${indent(2)}return self.${w}*self.${h}\n\nprint(${C}(${rint(1,5)},${rint(1,5)}).area())`; },
    () => { const C=pickClassName(), n=pickProp(); return `class ${C}:\n${indent()}def __init__(self, ${n}=0): self.${n}=${n}\n${indent()}def inc(self): self.${n}+=1\n${indent()}def value(self): return self.${n}\n\nc=${C}(${rint(0,3)}); c.inc(); print(c.value())`; },
    () => { const C=pickClassName(), nm=pickProp(); return `class ${C}:\n${indent()}def __init__(self,name): self._${nm}=name\n${indent()}@property\n${indent()}def ${nm}(self): return self._${nm}\n\nprint(${C}("${pickWord()}").${nm})`; },
    () => { const C=pickClassName(), x=pickProp(), y=pickProp(); return `class ${C}:\n${indent()}def __init__(self,${x},${y}): self.${x}=${x}; self.${y}=${y}\n${indent()}def add(self,o): return ${C}(self.${x}+o.${x}, self.${y}+o.${y})\n\nv=${C}(${rint(0,3)},${rint(0,3)}).add(${C}(${rint(0,3)},${rint(0,3)}))\nprint(v.${x}, v.${y})`; },
    () => { const C=pickClassName(), a=pickProp(); return `class ${C}:\n${indent()}def __init__(self, ${a}): self.${a}=${a}\n${indent()}def __repr__(self): return f"<${C} ${a}={{self.${a}}}>"\nprint(${C}(${rint(1,9)}))`; },
    () => { const C=pickClassName(); const m=pickMethodName(); return `class ${C}:\n${indent()}def ${m}(self):\n${indent(2)}print("${m}")\n${C}().${m}()`; },
    () => { const C=pickClassName(), p=pickProp(); return `class ${C}:\n${indent()}def __init__(self): self.${p}=[]\n${indent()}def add(self,x): self.${p}.append(x)\n${indent()}def size(self): return len(self.${p})\nq=${C}(); q.add(${rint(1,9)}); q.add(${rint(1,9)}); print(q.size())`; },
    () => { const C=pickClassName(); return `class ${C}(list):\n${indent()}def head(self): return self[0]\nprint(${C}([${arrOfNums(4)}]).head())`; },
    () => { const C=pickClassName(); return `class ${C}(Exception): pass\ntry:\n${indent()}raise ${C}("boom")\nexcept ${C} as e:\n${indent()}print(str(e))`; },
    () => { const A=pickClassName(), B=pickClassName(); return `class ${A}:\n${indent()}def v(self): return 1\nclass ${B}(${A}):\n${indent()}def v(self): return super().v()+1\nprint(${B}().v())`; },
  ]),
  OOP: ensureCount([
    () => { const A=pickClassName(), B=pickClassName(); return `class ${A}:\n${indent()}def v(self): return 1\nclass ${B}(${A}):\n${indent()}def v(self): return super().v()+1\nprint(${B}().v())`; },
    () => { const Animal=pickClassName(), Dog=pickClassName(); return `class ${Animal}:\n${indent()}def speak(self): raise NotImplementedError\nclass ${Dog}(${Animal}):\n${indent()}def speak(self): print("woof")\n${Dog}().speak()`; },
    () => { const A=pickClassName(), B=pickClassName(); return `class ${A}:\n${indent()}def __init__(self): self.n=1\nclass ${B}(${A}):\n${indent()}def inc(self): self.n+=1\nx=${B}(); x.inc(); print(x.n)`; },
    () => { const It=pickClassName(); return `class ${It}:\n${indent()}def __iter__(self): return iter([1,2,3])\nfor x in ${It}(): print(x)`; },
    () => { const A=pickClassName(), B=pickClassName(); return `class ${A}:\n${indent()}def f(self): return "A"\nclass ${B}(${A}):\n${indent()}def f(self): return super().f()+"B"\nprint(${B}().f())`; },
    () => { const A=pickClassName(), B=pickClassName(); return `class ${A}:\n${indent()}pass\nclass ${B}(${A}):\n${indent()}pass\nprint(isinstance(${B}(), ${A}))`; },
    () => { const A=pickClassName(); return `class ${A}:\n${indent()}@classmethod\n${indent()}def make(cls): return cls()\nprint(isinstance(${A}.make(), ${A}))`; },
    () => { const A=pickClassName(); return `class ${A}:\n${indent()}@staticmethod\n${indent()}def twice(x): return x*2\nprint(${A}.twice(${rint(2,9)}))`; },
    () => { const A=pickClassName(), p=pickProp(); return `class ${A}:\n${indent()}def __init__(self): self.${p}=0\n${indent()}def __getattr__(self, k): return 42\nx=${A}(); print(x.${p}, x.missing)`; },
    () => { const A=pickClassName(), p=pickProp(); return `class ${A}:\n${indent()}def __init__(self): self._${p}=0\n${indent()}@property\n${indent()}def ${p}(self): return self._${p}\n${indent()}@${p}.setter\n${indent()}def ${p}(self, v): self._${p}=v\nx=${A}(); x.${p}=${rint(1,9)}; print(x.${p})`; },
  ]),
  TYPING: ensureCount([
    () => `from typing import TypeVar, Generic, List\nT=TypeVar("T")\nclass Bag(Generic[T]):\n${indent()}def __init__(self): self.items: List[T]=[]\n${indent()}def add(self,x:T)->None: self.items.append(x)\n\nb=Bag[int](); b.add(3); print(b.items)`,
    () => `from typing import Union\nx: Union[int,str]\nx=${rint(0,1)} or "a"\nprint(x)`,
    () => `from typing import Optional\nx: Optional[int] = None\nx = x or ${rint(1,9)}\nprint(x)`,
    () => `from typing import Callable\nF=Callable[[int,int],int]\ndef add(a:int,b:int)->int: return a+b\nf:F=add\nprint(f(${rint(1,4)},${rint(5,9)}))`,
    () => `from typing import Iterable\ndef total(xs:Iterable[int])->int:\n${indent()}s=0\n${indent()}for x in xs: s+=x\n${indent()}return s\nprint(total([${arrOfNums(5)}]))`,
    () => `from typing import Dict\nD: Dict[str,int] = {"a":1,"b":2}\nprint(D)`,
    () => `from typing import Tuple\np: Tuple[int,int] = (${rint(1,5)}, ${rint(6,9)})\nprint(p)`,
    () => `from typing import List\nM: List[List[int]] = [[1,2],[3,4]]\nprint(M)`,
    () => `from typing import Literal\nmode: Literal["r","w"]="r"\nprint(mode)`,
    () => `from typing import Any\nx: Any = "str"\nprint(x)`,
  ]),
  DEC: ensureCount([
    () => `from functools import wraps\n\ndef log(fn):\n${indent()}@wraps(fn)\n${indent()}def inner(*a,**k):\n${indent(2)}print(fn.__name__)\n${indent(2)}return fn(*a,**k)\n${indent()}return inner\n\n@log\ndef add(a,b): return a+b\nprint(add(1,2))`,
    () => `def once(fn):\n${indent()}called=False\n${indent()}def inner(*a,**k):\n${indent(2)}nonlocal called\n${indent(2)}if called: return None\n${indent(2)}called=True; return fn(*a,**k)\n${indent()}return inner\n\n@once\ndef ping(): print("ping")\nping(); ping()`,
    () => `def tag(name):\n${indent()}def deco(fn):\n${indent(2)}def wrap(*a,**k):\n${indent(3)}print(name)\n${indent(3)}return fn(*a,**k)\n${indent(2)}return wrap\n${indent()}return deco\n\n@tag("T")\ndef f(): print(1)\nf()`,
    () => `def double(fn):\n${indent()}def w(*a,**k):\n${indent(2)}v=fn(*a,**k); return v*2\n${indent()}return w\n\n@double\ndef one(): return 1\nprint(one())`,
    () => `def memo(fn):\n${indent()}cache={}\n${indent()}def w(x):\n${indent(2)}if x in cache: return cache[x]\n${indent(2)}cache[x]=fn(x); return cache[x]\n${indent()}return w\n\n@memo\ndef sq(x): return x*x\nprint(sq(4), sq(4))`,
    () => `def logargs(fn):\n${indent()}def w(*a,**k): print(a,k); return fn(*a,**k)\n${indent()}return w\n\n@logargs\ndef add(a,b): return a+b\nprint(add(1,2))`,
    () => `def ensure_pos(fn):\n${indent()}def w(x):\n${indent(2)}v=fn(x); return v if v>0 else 0\n${indent()}return w\n\n@ensure_pos\ndef offset(x): return x-${rint(1,5)}\nprint(offset(${rint(1,9)}))`,
    () => `def call_twice(fn):\n${indent()}def w(*a,**k): fn(*a,**k); return fn(*a,**k)\n${indent()}return w\n\n@call_twice\ndef beep(): print("beep")\nbeep()`,
    () => `def noop(fn): return fn\n@noop\ndef x(): print("ok")\nx()`,
    () => `def guard(fn):\n${indent()}def w(x):\n${indent(2)}if x<0: return 0\n${indent(2)}return fn(x)\n${indent()}return w\n\n@guard\ndef id(x): return x\nprint(id(${rint(0,9)}-5))`,
  ]),
  IO: ensureCount([
    () => `with open("data.txt","w",encoding="utf-8") as f:\n${indent()}f.write("hello")\nwith open("data.txt") as f:\n${indent()}print(f.read())`,
    () => `with open("out.txt","w") as f: f.write(",".join(map(str,[${arrOfNums(4)}])))\nprint(open("out.txt").read())`,
    () => `open("bin.dat","wb").write(bytes([${arrOfNums(4,0,255)}]))\nprint(open("bin.dat","rb").read())`,
    () => `with open("log.txt","a") as f: f.write("x\\n")\nprint(sum(1 for _ in open("log.txt")))`,
    () => `import json\nopen("j.json","w").write(json.dumps({"a":1}))\nprint(open("j.json").read())`,
    () => `import csv\nopen("t.csv","w").write("a,b\\n1,2")\nprint(open("t.csv").read())`,
    () => `p="msg.txt"\nopen(p,"w").write("hi")\nprint(open(p).read().upper())`,
    () => `with open("bytes.bin","wb") as f: f.write(b"abc")\nprint(len(open("bytes.bin","rb").read()))`,
    () => `name="${pickWord()}.txt"\nopen(name,"w").write("ok")\nprint(open(name).read())`,
    () => `with open("tmp.txt","w") as f: f.write(str(${rint(1,9)}))\nprint(int(open("tmp.txt").read())+1)`,
  ]),
  REGEX: ensureCount([
    () => `import re\nm=re.findall(r"[a-z]+","ab12cdEF")\nprint(m)`,
    () => `import re\ns=re.sub(r"\\d","*", "a1b2c3")\nprint(s)`,
    () => `import re\nprint(bool(re.match(r"^a.+z$", "abcz")))`,
    () => `import re\nprint(re.split(r"[,;]","a,b;c"))`,
    () => `import re\nprint(re.search(r"(\\w+)", "word").group(1))`,
    () => `import re\nprint([m.group() for m in re.finditer(r"[A-Z]", "aA_bB")])`,
    () => `import re\nprint(re.fullmatch(r"[0-9]{3}","${rint(100,999)}") is not None)`,
    () => `import re\nprint(re.subn(r"\\s+"," ","a   b"))`,
    () => `import re\nprint(bool(re.compile(r"cat").search("concatenate")))`,
    () => `import re\nprint(re.escape("a+b"))`,
  ]),
  ASYNC: ensureCount([
    () => `import asyncio\nasync def work(i):\n${indent()}await asyncio.sleep(0)\n${indent()}print(i)\nasync def main():\n${indent()}await work(${rint(1,5)})\nasyncio.run(main())`,
    () => `import asyncio\nasync def add(a,b):\n${indent()}await asyncio.sleep(0)\n${indent()}return a+b\nasync def main():\n${indent()}x=await add(${rint(1,5)},${rint(6,9)})\n${indent()}print(x)\nasyncio.run(main())`,
    () => `import asyncio\nasync def ping(): print("ping")\nasyncio.run(ping())`,
    () => `import asyncio\nasync def f(): await asyncio.sleep(0); return ${rint(1,9)}\nasync def main():\n${indent()}a,b=await asyncio.gather(f(),f())\n${indent()}print(a+b)\nasyncio.run(main())`,
    () => `import asyncio\nasync def seq():\n${indent()}for i in range(3):\n${indent(2)}await asyncio.sleep(0)\n${indent(2)}print(i)\nasyncio.run(seq())`,
    () => `import asyncio\nasync def once(): return "ok"\nprint(asyncio.run(once()))`,
    () => `import asyncio\nasync def t(n): await asyncio.sleep(0); print(n)\nasyncio.run(t(${rint(1,5)}))`,
    () => `import asyncio\nasync def cpu(): return sum(range(${rint(50,200)}))\nprint(asyncio.run(cpu()))`,
    () => `import asyncio\nasync def read(): return "data"\nasync def main(): print(await read())\nasyncio.run(main())`,
    () => `import asyncio\nasync def chain():\n${indent()}async def g(x): return x+1\n${indent()}x=await g(${rint(1,9)})\n${indent()}print(x)\nasyncio.run(chain())`,
  ]),
};

// -------------- JavaScript + TypeScript --------------
const JS_BASE = {
  LOOPS: ensureCount([
    () => `for (let i = 0; i < ${rint(3,8)}; i++) {\n${indent()}console.log(i);\n}`,
    () => { const L=pickList(), x=pickVar(); return `const ${L}=[${arrOfNums(rint(3,5))}];\nfor (const ${x} of ${L}) {\n${indent()}if (${x} % 2 === 0) continue;\n${indent()}console.log(${x});\n}`; },
    () => { const v=pickVar(); return `let ${v}=${rint(0,2)};\nwhile (${v} <= ${rint(3,7)}) {\n${indent()}console.log(${v});\n${indent()}${v}++;\n}`; },
    () => { const L=pickList(); return `const ${L}=[${someWords(5)}];\n${L}.forEach(s=>{ if(s.includes("a")) console.log(s.toUpperCase()); });`; },
    () => { const i=pickVar(), j=pickVar(); return `for (let ${i}=0; ${i}<3; ${i}++) {\n${indent()}for (let ${j}=0; ${j}<2; ${j}++) console.log(${i}*${j});\n}`; },
    () => { const L=pickList(); return `const ${L}=[${arrOfNums(6)}];\nfor (let idx=0; idx<${L}.length; idx++) console.log(idx, ${L}[idx]);`; },
    () => { const L=pickList(), x=pickVar(); return `const ${L}=[${arrOfNums(6)}];\nfor (const ${x} of ${L}.filter(v=>v%2)) console.log(${x});`; },
    () => { const L=pickList(); return `const ${L}=Array.from({length:${rint(3,6)}},(_,i)=>i*i);\nconsole.log(${L});`; },
    () => { const v=pickVar(); return `for (let ${v}=${rint(1,3)}; ${v}<=${rint(4,8)}; ${v}+=2) console.log(${v});`; },
    () => { const L=pickList(); return `const ${L}=[${someWords(6)}];\nfor (const s of ${L}) { if (s.startsWith("a")) break; console.log(s); }`; },
  ]),
  CONDITION: ensureCount([
    () => `const x=${rint(0,10)};\nif (x < 3) {\n${indent()}console.log("low");\n} else if (x < 7) {\n${indent()}console.log("mid");\n} else {\n${indent()}console.log("high");\n}`,
    () => `const s="${pickWord()}";\nconsole.log(s.startsWith("a") ? "yes" : "no");`,
    () => { const a=pickVar(), b=pickVar(); return `const ${a}=${rint(1,9)}, ${b}=${rint(1,9)};\nconsole.log(${a}===${b}?"eq":"neq");`; },
    () => `const n=${rint(1,9)};\nconsole.log(n%2===0?"even":"odd");`,
    () => { const f=pickVar(); return `const ${f}=${rint(0,1)};\nif (${f}) console.log("on"); else console.log("off");`; },
    () => { const v=pickVar(); return `const ${v}=${rint(0,10)};\nconsole.log(${v}>=2 && ${v}<=5 ? "mid" : "edge");`; },
    () => `const tag="${pickWord()}";\nswitch(tag){ case "a": console.log(1); break; default: console.log(0); }`,
    () => `const ok=${rint(0,1)};\nconsole.log(ok && "${pickWord()}");`,
    () => { const L=pickList(); return `const ${L}=[${arrOfNums(5)}];\nconsole.log(${L}.length ? "nonempty" : "empty");`; },
    () => `const v=${rint(1,9)};\nconsole.log(v%3===0?"div3":(v%2===0?"div2":"other"));`,
  ]),
  FUNC: ensureCount([
    () => { const f=pickFuncName(); return `function ${f}(a, b = ${rint(1,5)}) { return a + b; }\nconsole.log(${f}(${rint(1,9)}));`; },
    () => { const f=pickFuncName(); return `const ${f} = (...args) => args.reduce((a,b)=>a+b,0);\nconsole.log(${f}(${arrOfNums(3)}));`; },
    () => { const f="fizz"; return `const ${f} = (n) => n%15===0?"FizzBuzz":n%3===0?"Fizz":n%5===0?"Buzz":n;\nconsole.log([...Array(15).keys()].map(i=>${f}(i+1)));`; },
    () => { const f=pickFuncName(); return `function ${f}(arr){ return Math.max(...arr); }\nconsole.log(${f}([${arrOfNums(5)}]));`; },
    () => { const f=pickFuncName(); return `const ${f} = s => s.toUpperCase();\nconsole.log(${f}("${pickWord()}"));`; },
    () => { const f=pickFuncName(); return `function ${f}(n){ return n<=1?1:n*${f}(n-1); }\nconsole.log(${f}(${rint(3,6)}));`; },
    () => { const f=pickFuncName(); return `function ${f}(xs){ let s=0; for(const x of xs) s+=x; return s; }\nconsole.log(${f}([${arrOfNums(5)}]));`; },
    () => { const f=pickFuncName(); return `const ${f} = xs => xs.slice().reverse();\nconsole.log(${f}([${arrOfNums(5)}]));`; },
    () => { const f=pickFuncName(); return `const ${f} = (a,b)=>({a,b});\nconsole.log(${f}(${rint(1,5)}, ${rint(6,9)}));`; },
    () => { const f=pickFuncName(); return `function ${f}(xs, p){ return xs.filter(p); }\nconsole.log(${f}([${arrOfNums(6)}], x=>x%2));`; },
  ]),
  EXC: ensureCount([
    () => `try {\n${indent()}JSON.parse("{bad}");\n} catch (e) {\n${indent()}console.log("fail");\n} finally {\n${indent()}console.log("done");\n}`,
    () => `function inv(x){ if(x===0) throw new Error("nope"); return 1/x; }\ntry { console.log(inv(${rint(0,2)})); } catch { console.log("caught"); }`,
    () => `try { throw new Error("boom"); } catch (e){ console.log(e.message); }`,
    () => `try { const a=[1]; console.log(a[2].x); } catch { console.log("undef"); }`,
    () => `try { decodeURIComponent("%"); } catch { console.log("bad uri"); }`,
    () => `try { null["x"]; } catch { console.log("null"); }`,
    () => `try { new Array(-1); } catch { console.log("range"); }`,
    () => `try { ({} as any).toFixed(); } catch { console.log("type"); }`,
    () => `try { throw "str"; } catch (e){ console.log("caught"); }`,
    () => `try { const x = JSON.stringify(BigInt(10)); } catch { console.log("bigint"); }`,
  ]),
  COMP: ensureCount([
    () => `const squares = Array.from({length:${rint(4,8)}},(_,i)=>i*i);\nconsole.log(squares);`,
    () => `const odds = [...Array(${rint(6,12)}).keys()].filter(x=>x%2===1);\nconsole.log(odds);`,
    () => `const dict = Object.fromEntries("abcde".split("").map(c=>[c,c.charCodeAt(0)]));\nconsole.log(dict);`,
    () => { const A=pickList(), B=pickList(); return `const ${A}=[${arrOfNums(3)}], ${B}=[${arrOfNums(3)}];\nconst pairs = ${A}.flatMap(a=>${B}.map(b=>[a,b]));\nconsole.log(pairs);`; },
    () => `const caps=[${someWords(5)}].filter(w=>w.includes("a")).map(w=>w.toUpperCase());\nconsole.log(caps);`,
    () => `const mat=[...Array(3)].map((_,i)=>[...Array(3)].map((_,j)=>i*j));\nconsole.log(mat);`,
    () => `const flat=[[1,2],[3,4]].flat();\nconsole.log(flat);`,
    () => `const uniq=[...new Set([${someWords(6)}].map(w=>w[0]))];\nconsole.log(uniq);`,
    () => `const idx=Object.fromEntries([${someWords(5)}].map((w,i)=>[w,i]));\nconsole.log(idx);`,
    () => `const windows=(xs,k)=>xs.slice(0, xs.length-k+1).map((_,i)=>xs.slice(i,i+k));\nconsole.log(windows([${arrOfNums(7)}],3));`,
  ]),
  CLASS: ensureCount([
    () => { const C=pickClassName(), x=pickProp(), y=pickProp(); return `class ${C} { constructor(${x}, ${y}) { this.${x}=${x}; this.${y}=${y}; } len(){ return Math.hypot(this.${x}, this.${y}); } }\nconsole.log(new ${C}(${rint(1,5)}, ${rint(1,5)}).len());`; },
    () => { const C=pickClassName(), w=pickProp(), h=pickProp(); return `class ${C} { constructor(${w}, ${h}){ this.${w}=${w}; this.${h}=${h}; } area(){ return this.${w}*this.${h}; } }\nconsole.log(new ${C}(${rint(1,5)}, ${rint(1,5)}).area());`; },
    () => { const C=pickClassName(), n=pickProp(); return `class ${C} { constructor(${n}=0){ this.${n}=${n}; } inc(){ this.${n}++; } value(){ return this.${n}; } }\nconst c=new ${C}(${rint(0,3)}); c.inc(); console.log(c.value());`; },
    () => { const C=pickClassName(), nm=pickProp(); return `class ${C} { #${nm}; constructor(name){ this.#${nm}=name; } get ${nm}(){ return this.#${nm}; } }\nconsole.log(new ${C}("${pickWord()}").${nm});`; },
    () => { const C=pickClassName(), a=pickProp(); return `class ${C} { constructor(${a}){ this.${a}=${a}; } toString(){ return "<${C}>"; } }\nconsole.log(String(new ${C}(${rint(1,9)})));`; },
    () => { const C=pickClassName(); const m=pickMethodName(); return `class ${C} { ${m}(){ console.log("${m}"); } }\nnew ${C}().${m}();`; },
    () => { const C=pickClassName(), p=pickProp(); return `class ${C} { constructor(){ this.${p}=[]; } add(x){ this.${p}.push(x); } size(){ return this.${p}.length; } }\nconst q=new ${C}(); q.add(${rint(1,9)}); q.add(${rint(1,9)}); console.log(q.size());`; },
    () => { const C=pickClassName(), x=pickProp(), y=pickProp(); return `class ${C} { constructor(${x}, ${y}){ this.${x}=${x}; this.${y}=${y}; } add(o){ return new ${C}(this.${x}+o.${x}, this.${y}+o.${y}); } }\nconst v=new ${C}(${rint(0,3)},${rint(0,3)}).add(new ${C}(${rint(0,3)},${rint(0,3)}));\nconsole.log(v.${x}, v.${y});`; },
    () => { const C=pickClassName(); return `class ${C} extends Array { head(){ return this[0]; } }\nconsole.log(new ${C}(${arrOfNums(4)}).head());`; },
    () => { const C=pickClassName(); return `class ${C} extends Error { }\ntry{ throw new ${C}("boom"); } catch(e){ console.log(e.message); }`; },
  ]),
  OOP: ensureCount([
    () => { const A=pickClassName(), B=pickClassName(); return `class ${A}{ value(){ return 1; }}\nclass ${B} extends ${A}{ value(){ return super.value()+1; }}\nconsole.log(new ${B}().value());`; },
    () => { const Animal=pickClassName(), Dog=pickClassName(); return `class ${Animal}{ speak(){ throw new Error("NI"); }}\nclass ${Dog} extends ${Animal}{ speak(){ console.log("woof"); }}\nnew ${Dog}().speak();`; },
    () => { const A=pickClassName(), B=pickClassName(); return `class ${A}{ constructor(){ this.n=1; } }\nclass ${B} extends ${A}{ inc(){ this.n++; } }\nconst x=new ${B}(); x.inc(); console.log(x.n);`; },
    () => { const A=pickClassName(), B=pickClassName(); return `class ${A}{ f(){ return "A"; } }\nclass ${B} extends ${A}{ f(){ return super.f()+"B"; } }\nconsole.log(new ${B}().f());`; },
    () => { const A=pickClassName(), B=pickClassName(); return `class ${A}{}\nclass ${B} extends ${A}{}\nconsole.log(new ${B}() instanceof ${A});`; },
    () => { const A=pickClassName(); return `class ${A}{ static make(){ return new ${A}(); } }\nconsole.log(${A}.make() instanceof ${A});`; },
    () => { const A=pickClassName(); return `class ${A}{ static twice(x){ return x*2; } }\nconsole.log(${A}.twice(${rint(2,9)}));`; },
    () => { const A=pickClassName(); return `class ${A}{ constructor(){ this._v=0; } get v(){ return this._v; } set v(x){ this._v=x; } }\nconst a=new ${A}(); a.v=${rint(1,9)}; console.log(a.v);`; },
    () => { const A=pickClassName(); return `class ${A}{ toString(){ return "<${A}>"; } }\nconsole.log(String(new ${A}()));`; },
    () => { const A=pickClassName(); return `class ${A}{ constructor(){ if(new.target===${A}) throw new Error("abstract"); } }\ntry{ new ${A}(); } catch(e){ console.log("abs"); }`; },
  ]),
  IO: ensureCount([
    () => `// Node.js\nconst fs=require("fs");\nfs.writeFileSync("out.txt","hi");\nconsole.log(fs.readFileSync("out.txt","utf8"));`,
    () => `const fs=require("fs");\nconst p="${pickWord()}.txt";\nfs.writeFileSync(p,"${pickWord()}");\nconsole.log(fs.readFileSync(p,"utf8"));`,
    () => `const fs=require("fs");\nfs.appendFileSync("log.txt","x\\n");\nconsole.log(fs.readFileSync("log.txt","utf8").trim().split("\\n").length);`,
    () => `const fs=require("fs");\nfs.writeFileSync("nums.txt",[${arrOfNums(5)}].join(","));\nconsole.log(fs.readFileSync("nums.txt","utf8"));`,
    () => `const fs=require("fs");\nfs.writeFileSync("bin.dat",Buffer.from([${arrOfNums(4,0,255)}]));\nconsole.log(fs.readFileSync("bin.dat").length);`,
    () => `const fs=require("fs");\ntry{ fs.readFileSync("missing.txt"); }catch{ console.log("missing"); }`,
    () => `const fs=require("fs");\nconst p2="tmp.txt"; fs.writeFileSync(p2,"1"); fs.renameSync(p2,"renamed.txt"); console.log("ok");`,
    () => `const fs=require("fs");\nfs.mkdirSync("d", {recursive:true}); fs.writeFileSync("d/a.txt","x"); console.log(fs.readdirSync("d"));`,
    () => `const fs=require("fs");\nfs.copyFileSync(__filename, "copy.js"); console.log("copied");`,
    () => `const fs=require("fs");\nfs.rmSync("maybe.txt", {force:true}); console.log("clean");`,
  ]),
  REGEX: ensureCount([
    () => `const m="ab12cdEF".match(/[a-z]+/g); console.log(m);`,
    () => `console.log("a1b2c3".replace(/\\d/g,"*"));`,
    () => `console.log(/^a.+z$/.test("abcz"));`,
    () => `console.log("a,b;c".split(/[,;]/));`,
    () => `console.log(/(\\w+)/.exec("word")[1]);`,
    () => `console.log([..."aA_bB"].filter(c=>/[A-Z]/.test(c)));`,
    () => `console.log(/^[0-9]{3}$/.test("${rint(100,999)}"));`,
    () => `console.log("a   b".replace(/\\s+/g," "));`,
    () => `console.log(/cat/.test("concatenate"));`,
    () => `console.log("a+b".replace(/[+]/g,"\\$&"));`,
  ]),
  ASYNC: ensureCount([
    () => `const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));\n(async()=>{ await sleep(0); console.log(${rint(1,5)}); })();`,
    () => `async function fetchNum(){ return ${rint(1,9)}; }\n(async()=>{ const [a,b]=await Promise.all([fetchNum(),fetchNum()]); console.log(a+b); })();`,
    () => `;(async()=>{ console.log(await (async()=> "ok")()); })();`,
    () => `async function seq(){ for(let i=0;i<3;i++){ await 0; console.log(i); } }\nseq();`,
    () => `async function add(a,b){ await 0; return a+b; }\nadd(${rint(1,5)},${rint(6,9)}).then(console.log);`,
    () => `const f=async()=>${rint(1,9)}; (async()=>console.log(await f()))();`,
    () => `async function chain(){ const g=async x=>x+1; console.log(await g(${rint(1,9)})); }\nchain();`,
    () => `async function maybe(){ if(${rint(0,1)}) return "a"; throw new Error("x"); }\nmaybe().then(console.log).catch(()=>console.log("err"));`,
    () => `const fetcher=async()=>({a:1});\nfetcher().then(o=>console.log(o.a));`,
    () => `const f2=async(n)=>{ await 0; console.log(n); };\nPromise.all([1,2,3].map(f2));`,
  ]),
};

const TS_ONLY = {
  TYPING: ensureCount([
    () => `function pair<T>(a:T,b:T):[T,T]{ return [a,b]; }\nconst p = pair<number>(${rint(1,5)}, ${rint(6,9)});\nconsole.log(p);`,
    () => `interface User{ id:number; name:string; }\nconst u:User={id:1,name:"a"}; console.log(u.name);`,
    () => `type NumOrStr = number | string; let x: NumOrStr = ${rint(0,1)} ? ${rint(1,9)} : "hi"; console.log(x);`,
    () => `type F<T>= (x:T)=>T; const id:F<number>=x=>x; console.log(id(${rint(1,9)}));`,
    () => `type Pair<A,B>={a:A;b:B}; const p2:Pair<number,string>={a:1,b:"x"}; console.log(p2.b);`,
    () => `type ReadonlyPoint = { readonly x:number; y:number };\nconst pt:ReadonlyPoint={x:1,y:2}; console.log(pt.x);`,
    () => `type Lit="a"|"b"; const v:Lit="a"; console.log(v);`,
    () => `type Opt<T>=T|null; const x:Opt<number>=null; console.log(x);`,
    () => `function mapT<T>(xs:T[], f:(t:T)=>T){ return xs.map(f); }\nconsole.log(mapT([${arrOfNums(4)}], x=>x+1));`,
    () => `class Box<T>{ v:T; constructor(v:T){ this.v=v; } get(){ return this.v; } }\nconsole.log(new Box<number>(${rint(1,9)}).get());`,
  ]),
  DECORATORS: ensureCount([
    () => `function log(target:any, key:string, desc:PropertyDescriptor){ const orig=desc.value; desc.value=function(...a:any[]){ console.log(key); return orig.apply(this,a); }; }\nclass A{ @log greet(){ console.log("hi"); } }\nnew A().greet();`,
    () => `function time(_:any,__ :string, desc:PropertyDescriptor){ const f=desc.value; desc.value=function(...a:any[]){ const t=Date.now(); const r=f.apply(this,a); console.log(Date.now()-t); return r; }; }\nclass T{ @time run(){ for(let i=0;i<1e3;i++); } }\nnew T().run();`,
    () => `function readonly(_:any, __:string, d:PropertyDescriptor){ d.writable=false; }\nclass B{ @readonly name(){ return "x"; } }\nconsole.log(new B().name());`,
    () => `function tag(label:string){ return (_:any, __:string, d:PropertyDescriptor)=>{ const f=d.value; d.value=function(...a:any[]){ console.log(label); return f.apply(this,a); }; }; }\nclass L{ @tag("T") f(){ console.log(1); } }\nnew L().f();`,
    () => `function deprec(_:any, __:string, d:PropertyDescriptor){ const f=d.value; d.value=function(...a:any[]){ console.log("deprecated"); return f.apply(this,a); }; }\nclass D{ @deprec old(){ return 1; } }\nconsole.log(new D().old());`,
    () => `function once(_:any, __:string, d:PropertyDescriptor){ const f=d.value; let called=false; d.value=function(...a:any[]){ if(called) return; called=true; return f.apply(this,a); }; }\nclass O{ @once ping(){ console.log("ping"); } }\nconst o=new O(); o.ping(); o.ping();`,
    () => `function guard(_:any, __:string, d:PropertyDescriptor){ const f=d.value; d.value=function(x:number){ if(x<0) return 0; return f.call(this,x); }; }\nclass G{ @guard id(x:number){ return x; } }\nconsole.log(new G().id(${rint(-3,3)}));`,
    () => `function dbl(_:any, __:string, d:PropertyDescriptor){ const f=d.value; d.value=function(x:number){ return f.call(this,x)*2; }; }\nclass H{ @dbl f(x:number){ return x+1; } }\nconsole.log(new H().f(${rint(1,9)}));`,
    () => `function logArgs(_:any, __:string, d:PropertyDescriptor){ const f=d.value; d.value=function(...a:any[]){ console.log(a.length); return f.apply(this,a); }; }\nclass LA{ @logArgs f(a:number,b:number){ return a+b; } }\nconsole.log(new LA().f(1,2));`,
    () => `function noop(_:any, __:string, d:PropertyDescriptor){ }\nclass N{ @noop f(){ console.log("ok"); } }\nnew N().f();`,
  ]),
};

// -------------- Java --------------
const JAVA = {
  LOOPS: ensureCount([
    () => `for (int i = 0; i < ${rint(3,8)}; i++) {\n${indent()}System.out.println(i);\n}`,
    () => `int i = 0;\nwhile (i <= ${rint(3,7)}) {\n${indent()}System.out.println(i);\n${indent()}i++;\n}`,
    () => { const i=pickVar(), j=pickVar(); return `for (int ${i}=0; ${i}<3; ${i}++){\n${indent()}for(int ${j}=0; ${j}<2; ${j}++) System.out.println(${i}*${j});\n}`; },
    () => { const L=pickList(); return `int[] ${L} = new int[]{${arrOfNums(5)}};\nfor(int v: ${L}) System.out.println(v);`; },
    () => `for (int i=${rint(1,3)}; i<=${rint(4,8)}; i+=2) System.out.println(i);`,
    () => { const L=pickList(); return `int[] ${L} = new int[]{${arrOfNums(6)}};\nfor(int idx=0; idx<${L}.length; idx++) System.out.println(idx + ":" + ${L}[idx]);`; },
    () => { const L=pickList(); return `String[] ${L} = new String[]{${someWords(5)}};\nfor(String s: ${L}) if(s.contains("a")) System.out.println(s.toUpperCase());`; },
    () => `for (int i=0;i<3;i++) System.out.println("x");`,
    () => `int n=${rint(3,7)}; while(n-->0) System.out.println(n);`,
    () => `int s=0; for(int v: new int[]{${arrOfNums(4)}}) s+=v; System.out.println(s);`,
  ]),
  CONDITION: ensureCount([
    () => `int x=${rint(0,10)};\nif (x<3) {\n${indent()}System.out.println("low");\n} else if (x<7) {\n${indent()}System.out.println("mid");\n} else {\n${indent()}System.out.println("high");\n}`,
    () => `String s="${pickWord()}";\nSystem.out.println(s.startsWith("a")?"yes":"no");`,
    () => { const a=pickVar(), b=pickVar(); return `int ${a}=${rint(1,9)}, ${b}=${rint(1,9)};\nSystem.out.println(${a}==${b}?"eq":"neq");`; },
    () => `int n=${rint(1,9)};\nSystem.out.println(n%2==0?"even":"odd");`,
    () => { const v=pickVar(); return `int ${v}=${rint(0,10)};\nSystem.out.println(${v}>=2 && ${v}<=5 ? "mid" : "edge");`; },
    () => `String tag="${pickWord()}";\nswitch(tag){ case "a" -> System.out.println(1); default -> System.out.println(0); }`,
    () => `boolean ok=${rint(0,1)===1};\nSystem.out.println(ok ? "${pickWord()}" : "");`,
    () => `int[] a=new int[]{${arrOfNums(4)}};\nSystem.out.println(a.length>0?"nonempty":"empty");`,
    () => `int v=${rint(1,9)};\nSystem.out.println(v%3==0?"div3":(v%2==0?"div2":"other"));`,
    () => `int z=${rint(0,1)}; if(z==1) System.out.println("on"); else System.out.println("off");`,
  ]),
  FUNC: ensureCount([
    () => `static int add(int a,int b){ return a+b; }\nSystem.out.println(add(${rint(1,5)},${rint(1,5)}));`,
    () => `static int total(int... xs){ int s=0; for(int x:xs) s+=x; return s; }\nSystem.out.println(total(${arrOfNums(3)}));`,
    () => `static int max(int[] a){ int m=a[0]; for(int v:a) if(v>m) m=v; return m; }\nSystem.out.println(max(new int[]{${arrOfNums(5)}}));`,
    () => `static String up(String s){ return s.toUpperCase(); }\nSystem.out.println(up("${pickWord()}"));`,
    () => `static int fact(int n){ return n<=1?1:n*fact(n-1); }\nSystem.out.println(fact(${rint(3,6)}));`,
    () => `static int sum(int[] a){ int s=0; for(int v:a)s+=v; return s; }\nSystem.out.println(sum(new int[]{${arrOfNums(5)}}));`,
    () => `static int[] rev(int[] a){ int n=a.length; int[] b=new int[n]; for(int i=0;i<n;i++) b[i]=a[n-1-i]; return b; }\nSystem.out.println(java.util.Arrays.toString(rev(new int[]{${arrOfNums(5)}})));`,
    () => `static int pair(int a,int b){ return a+b; }\nSystem.out.println(pair(${rint(1,5)}, ${rint(6,9)}));`,
    () => `static int[] filt(int[] xs){ return java.util.Arrays.stream(xs).filter(x->x%2==1).toArray(); }\nSystem.out.println(java.util.Arrays.toString(filt(new int[]{${arrOfNums(6)}})));`,
    () => `static String join(String[] s){ return String.join(",", s); }\nSystem.out.println(join(new String[]{${someWords(4)}}));`,
  ]),
  EXC: ensureCount([
    () => `try {\n${indent()}int x=Integer.parseInt("NaN");\n${indent()}System.out.println(x);\n} catch (NumberFormatException e) {\n${indent()}System.out.println("fail");\n} finally {\n${indent()}System.out.println("done");\n}`,
    () => `static int inv(int x){ if(x==0) throw new ArithmeticException("nope"); return 1/x; }\ntry{ System.out.println(inv(${rint(0,2)})); } catch (ArithmeticException e){ System.out.println("caught"); }`,
    () => `try{ throw new RuntimeException("boom"); }catch(RuntimeException e){ System.out.println(e.getMessage()); }`,
    () => `try{ int[] a=new int[1]; System.out.println(a[2]); }catch(ArrayIndexOutOfBoundsException e){ System.out.println("oob"); }`,
    () => `try{ String s=null; System.out.println(s.length()); }catch(NullPointerException e){ System.out.println("null"); }`,
    () => `try{ java.net.URI.create("%"); }catch(IllegalArgumentException e){ System.out.println("bad uri"); }`,
    () => `try{ new int[ -1 ]; }catch(NegativeArraySizeException e){ System.out.println("neg"); }`,
    () => `try{ Class.forName("no.such.Class"); }catch(ClassNotFoundException e){ System.out.println("cnf"); }`,
    () => `try{ java.nio.file.Files.readString(java.nio.file.Path.of("missing")); }catch(java.io.IOException e){ System.out.println("io"); }`,
    () => `try{ assert false; }catch(AssertionError e){ System.out.println("assert"); }`,
  ]),
  CLASS: ensureCount([
    () => { const C=pickClassName(), x=pickVar(), y=pickVar();
      return `class ${C} { int ${x}, ${y}; ${C}(int ${x}, int ${y}){ this.${x}=${x}; this.${y}=${y}; } double len(){ return Math.hypot(${x}, ${y}); } }\nSystem.out.println(new ${C}(${rint(1,5)}, ${rint(1,5)}).len());`; },
    () => { const C=pickClassName(), w=pickVar(), h=pickVar();
      return `class ${C} { int ${w}, ${h}; ${C}(int ${w}, int ${h}){ this.${w}=${w}; this.${h}=${h}; } int area(){ return ${w} * ${h}; } }\nSystem.out.println(new ${C}(${rint(1,5)}, ${rint(1,5)}).area());`; },
    () => { const C=pickClassName(), n=pickVar();
      return `class ${C} { int ${n}; ${C}(int ${n}){ this.${n}=${n}; } void inc(){ this.${n}++; } int value(){ return this.${n}; } }\n${C} c = new ${C}(${rint(0,3)}); c.inc(); System.out.println(c.value());`; },
    () => { const C=pickClassName(), nm=pickVar();
      return `class ${C} { private final String ${nm}; ${C}(String n){ this.${nm}=n; } String ${nm}(){ return ${nm}; } }\nSystem.out.println(new ${C}("${pickWord()}").${nm}());`; },
    () => { const C=pickClassName(), p=pickProp(); return `class ${C} { private int ${p}=0; int get${cap(p)}(){ return ${p}; } }\nSystem.out.println(new ${C}().get${cap(p)}());`; },
    () => { const C=pickClassName(), a=pickProp(); return `class ${C} { private final int ${a}; ${C}(int ${a}){ this.${a}=${a}; } public String toString(){ return "<${C}>"; } }\nSystem.out.println(new ${C}(${rint(1,9)}));`; },
    () => { const C=pickClassName(), x=pickVar(), y=pickVar(); return `class ${C} { int ${x},${y}; ${C}(int ${x},int ${y}){ this.${x}=${x}; this.${y}=${y}; } ${C} add(${C} o){ return new ${C}(this.${x}+o.${x}, this.${y}+o.${y}); } }\n${C} v=new ${C}(${rint(0,3)},${rint(0,3)}).add(new ${C}(${rint(0,3)},${rint(0,3)}));\nSystem.out.println(v.${x}+","+v.${y});`; },
    () => { const C=pickClassName(); return `class ${C} extends java.util.ArrayList<Integer> { Integer head(){ return get(0); } }\nSystem.out.println(new ${C}(){ { add(1); add(2); } }.head());`; },
    () => { const C=pickClassName(); return `class ${C} extends RuntimeException { ${C}(String m){ super(m); } }\ntry{ throw new ${C}("boom"); }catch(${C} e){ System.out.println(e.getMessage()); }`; },
    () => { const C=pickClassName(), p=pickProp(); return `class ${C} { private int _${p}; int ${p}(){ return _${p}; } void ${p}(int v){ _${p}=v; } }\n${C} a=new ${C}(); a.${p}(${rint(1,9)}); System.out.println(a.${p}());`; },
  ]),
  OOP: ensureCount([
    () => { const A=pickClassName(), B=pickClassName();
      return `class ${A} { int v(){ return 1; } }\nclass ${B} extends ${A} { int v(){ return super.v() + 1; } }\nSystem.out.println(new ${B}().v());`; },
    () => { const Animal=pickClassName(), Dog=pickClassName();
      return `abstract class ${Animal} { abstract void speak(); }\nclass ${Dog} extends ${Animal} { void speak(){ System.out.println("woof"); } }\nnew ${Dog}().speak();`; },
    () => { const A=pickClassName(), B=pickClassName(); return `class ${A}{ int n=1; }\nclass ${B} extends ${A}{ void inc(){ n++; } }\n${B} x=new ${B}(); x.inc(); System.out.println(x.n);`; },
    () => { const A=pickClassName(), B=pickClassName(); return `class ${A}{ String f(){ return "A"; } }\nclass ${B} extends ${A}{ String f(){ return super.f()+"B"; } }\nSystem.out.println(new ${B}().f());`; },
    () => { const A=pickClassName(), B=pickClassName(); return `class ${A}{}\nclass ${B} extends ${A}{}\nSystem.out.println(new ${B}() instanceof ${A});`; },
    () => { const A=pickClassName(); return `class ${A}{ static ${A} make(){ return new ${A}(); } }\nSystem.out.println(${A}.make() instanceof ${A});`; },
    () => { const A=pickClassName(); return `class ${A}{ static int twice(int x){ return x*2; } }\nSystem.out.println(${A}.twice(${rint(2,9)}));`; },
    () => { const A=pickClassName(), p=pickProp(); return `class ${A}{ private int ${p}; int get${cap(p)}(){ return ${p}; } void set${cap(p)}(int v){ ${p}=v; } }\n${A} a=new ${A}(); a.set${cap(p)}(${rint(1,9)}); System.out.println(a.get${cap(p)}());`; },
    () => { const A=pickClassName(); return `class ${A}{ public String toString(){ return "<${A}>"; } }\nSystem.out.println(new ${A}());`; },
    () => { const A=pickClassName(); return `abstract class ${A}{ ${A}(){ super(); } }\nSystem.out.println("ok");`; },
  ]),
  TYPING: ensureCount([
    () => { const Box=pickClassName(); return `class ${Box}<T> { T v; ${Box}(T v){ this.v=v; } T get(){ return v; } }\nSystem.out.println(new ${Box}<Integer>(42).get());`; },
    () => { const Pair=pickClassName(); return `record ${Pair}<A,B>(A a,B b){}\n${Pair}<Integer,String> p = new ${Pair}<>(1, "a");\nSystem.out.println(p.a() + "," + p.b());`; },
    () => { const Bag=pickClassName(); return `class ${Bag}<T> extends java.util.ArrayList<T>{}\n${Bag}<String> b=new ${Bag}<>(); b.add("x"); System.out.println(b.get(0));`; },
    () => { const Opt=pickClassName(); return `class ${Opt}<T>{ final T v; ${Opt}(T v){ this.v=v; } }\nSystem.out.println(new ${Opt}<Integer>(1).v);`; },
    () => { const K=pickClassName(), V=pickClassName(); return `java.util.Map<${K},${V}> m=new java.util.HashMap<>(); System.out.println(m.isEmpty());`; },
    () => { const P=pickClassName(); return `record ${P}<X>(X x){}\nSystem.out.println(new ${P}<Integer>(1).x());`; },
    () => { const R=pickClassName(); return `class ${R}<T extends Number>{ T v; }\nSystem.out.println("ok");`; },
    () => { const S=pickClassName(); return `class ${S}<T>{ T id(T x){ return x; } }\nSystem.out.println(new ${S}<Integer>().id(3));`; },
    () => { const U=pickClassName(); return `interface ${U}<T>{ T apply(T x); }\n${U}<Integer> f=x->x+1; System.out.println(f.apply(1));`; },
    () => { const W=pickClassName(); return `class ${W}<A,B>{ A a; B b; }\nSystem.out.println("ok");`; },
  ]),
  IO: ensureCount([
    () => { const fname=`${pickWord()}.txt`;
      return `java.nio.file.Files.writeString(java.nio.file.Path.of("${fname}"), "hi");\nSystem.out.println(java.nio.file.Files.readString(java.nio.file.Path.of("${fname}")));`; },
    () => `java.nio.file.Files.writeString(java.nio.file.Path.of("nums.txt"), java.util.Arrays.toString(new int[]{${arrOfNums(5)}}));\nSystem.out.println(java.nio.file.Files.readString(java.nio.file.Path.of("nums.txt")));`,
    () => `java.nio.file.Files.write(java.nio.file.Path.of("bin.dat"), new byte[]{1,2,3});\nSystem.out.println(java.nio.file.Files.size(java.nio.file.Path.of("bin.dat")));`,
    () => `java.nio.file.Files.createDirectories(java.nio.file.Path.of("d"));\njava.nio.file.Files.writeString(java.nio.file.Path.of("d/a.txt"),"x");\nSystem.out.println(java.util.Arrays.toString(java.nio.file.Files.list(java.nio.file.Path.of("d")).toArray()));`,
    () => `try{ java.nio.file.Files.readString(java.nio.file.Path.of("missing")); }catch(java.io.IOException e){ System.out.println("io"); }`,
    () => `java.nio.file.Files.writeString(java.nio.file.Path.of("log.txt"), "x\\n", java.nio.file.StandardOpenOption.CREATE, java.nio.file.StandardOpenOption.APPEND);\nSystem.out.println("ok");`,
    () => `java.nio.file.Files.copy(java.nio.file.Path.of("log.txt"), java.nio.file.Path.of("copy.txt"), java.nio.file.StandardCopyOption.REPLACE_EXISTING);\nSystem.out.println("copied");`,
    () => `java.nio.file.Files.deleteIfExists(java.nio.file.Path.of("maybe.txt"));\nSystem.out.println("clean");`,
    () => `java.nio.file.Files.writeString(java.nio.file.Path.of("rename_src.txt"), "x");\njava.nio.file.Files.move(java.nio.file.Path.of("rename_src.txt"), java.nio.file.Path.of("renamed.txt"), java.nio.file.StandardCopyOption.REPLACE_EXISTING);\nSystem.out.println("renamed");`,
    () => `java.nio.file.Files.writeString(java.nio.file.Path.of("${pickWord()}.txt"), "${pickWord()}");\nSystem.out.println("ok");`,
  ]),
  REGEX: ensureCount([
    () => `java.util.regex.Pattern p = java.util.regex.Pattern.compile("[a-z]+");\njava.util.regex.Matcher m = p.matcher("ab12cdEF");\nwhile (m.find()) System.out.println(m.group());`,
    () => `System.out.println("a1b2c3".replaceAll("\\\\d","*"));`,
    () => `System.out.println("abcz".matches("^a.+z$"));`,
    () => { const s=pickWord(); return `System.out.println(java.util.Arrays.toString("${s},b;c".split("[,;]")));`; },
    () => `java.util.regex.Matcher m = java.util.regex.Pattern.compile("(\\\\w+)").matcher("word"); m.find(); System.out.println(m.group(1));`,
    () => `System.out.println(java.util.Arrays.toString("aA_bB".replaceAll("[^A-Z]","").split("")));`,
    () => `System.out.println(String.valueOf(${rint(100,999)}).matches("[0-9]{3}"));`,
    () => `System.out.println("a   b".replaceAll("\\\\s+"," "));`,
    () => `System.out.println(java.util.regex.Pattern.compile("cat").matcher("concatenate").find());`,
    () => `System.out.println(java.util.regex.Pattern.quote("a+b"));`,
  ]),
};

// -------------- C --------------
const C = {
  LOOPS: ensureCount([
    () => { const i=pickVar();
      return `for (int ${i}=${rint(0,1)}; ${i}<${rint(3,8)}; ${i}++) {\n${indent()}printf("%d\\n", ${i});\n}`; },
    () => { const i=pickVar();
      return `int ${i}=0;\nwhile (${i} <= ${rint(3,7)}) {\n${indent()}printf("%d\\n", ${i});\n${indent()}${i}++;\n}`; },
    () => `for (int i=0;i<3;i++) for(int j=0;j<2;j++) printf("%d\\n", i*j);`,
    () => `int a[]={${arrOfNums(5)}}; for(size_t i=0;i<sizeof a/sizeof*a;i++) printf("%d\\n", a[i]);`,
    () => `for (int i=${rint(1,3)}; i<=${rint(4,8)}; i+=2) printf("%d\\n", i);`,
    () => `int a[]={${arrOfNums(6)}}; for (int i=0;i<6;i++) printf("%d:%d\\n", i, a[i]);`,
    () => `const char* s[]={"${pickWord()}","${pickWord()}","${pickWord()}"}; for(int i=0;i<3;i++) if(strchr(s[i],'a')) puts(s[i]);`,
    () => `for(int i=0;i<3;i++) puts("x");`,
    () => `int n=${rint(3,7)}; while(n-->0) printf("%d\\n", n);`,
    () => `int s=0; int a2[]={${arrOfNums(4)}}; for(int i=0;i<4;i++) s+=a2[i]; printf("%d\\n", s);`,
  ]),
  CONDITION: ensureCount([
    () => { const x=pickVar(); return `int ${x}=${rint(0,10)};\nif (${x}<3) {\n${indent()}printf("low\\n");\n} else if (${x}<7) {\n${indent()}printf("mid\\n");\n} else {\n${indent()}printf("high\\n");\n}`; },
    () => { const s=pickVar(); return `char *${s}="${pickWord()}";\nprintf("%s\\n", ${s}[0]=='a' ? "yes" : "no");`; },
    () => `int n=${rint(1,9)}; printf("%s\\n", n%2==0?"even":"odd");`,
    () => { const v=pickVar(); return `int ${v}=${rint(0,10)}; printf("%s\\n", (${v}>=2 && ${v}<=5)?"mid":"edge");`; },
    () => `char tag[]="${pickWord()}"; if(tag[0]=='a') puts("1"); else puts("0");`,
    () => { const ok=pickVar(); return `int ${ok}=${rint(0,1)}; if(${ok}) puts("${pickWord()}");`; },
    () => `int a[]={${arrOfNums(4)}}; printf("%s\\n", (sizeof a/sizeof*a)?"nonempty":"empty");`,
    () => `int v=${rint(1,9)}; puts(v%3==0?"div3":(v%2==0?"div2":"other"));`,
    () => `int z=${rint(0,1)}; puts(z?"on":"off");`,
    () => `int x2=${rint(1,9)}, y2=${rint(1,9)}; puts(x2==y2?"eq":"neq");`,
  ]),
  FUNC: ensureCount([
    () => { const add=pickVar(); return `int ${add}(int a,int b){ return a+b; }\nprintf("%d\\n", ${add}(${rint(1,5)}, ${rint(1,5)}));`; },
    () => { const total=pickVar(), xs=pickList(); return `int ${total}(int *a,int n){ int s=0; for(int i=0;i<n;i++) s+=a[i]; return s; }\nint ${xs}[] = {${arrOfNums(3)}};\nprintf("%d\\n", ${total}(${xs}, 3));`; },
    () => { const f=pickVar(); return `int ${f}(int n){ return n<=1?1:n*${f}(n-1); }\nprintf("%d\\n", ${f}(${rint(3,6)}));`; },
    () => { const f=pickVar(); return `int ${f}(int *a,int n){ int m=a[0]; for(int i=1;i<n;i++) if(a[i]>m) m=a[i]; return m; }\nint xs[]={${arrOfNums(5)}}; printf("%d\\n", ${f}(xs,5));`; },
    () => { const f=pickVar(); return `void ${f}(const char* s){ puts(s); }\n${f}("${pickWord()}");`; },
    () => { const f=pickVar(); return `void ${f}(int *a,int n){ for(int i=0;i<n/2;i++){ int t=a[i]; a[i]=a[n-1-i]; a[n-1-i]=t; }}\nint xs2[]={${arrOfNums(5)}}; ${f}(xs2,5); printf("%d\\n", xs2[0]);`; },
    () => { const f=pickVar(); return `int ${f}(int a,int b){ return a+b; }\nprintf("%d\\n", ${f}(${rint(1,5)}, ${rint(6,9)}));`; },
    () => { const f=pickVar(); return `int ${f}(int *a,int n){ int s=0; for(int i=0;i<n;i++) if(a[i]%2) s+=a[i]; return s; }\nint xs3[]={${arrOfNums(6)}}; printf("%d\\n", ${f}(xs3,6));`; },
    () => { const f=pickVar(); return `int ${f}(int x){ return x; }\nprintf("%d\\n", ${f}(${rint(1,9)}));`; },
    () => { const f=pickVar(); return `void ${f}(int x){ printf("%d\\n", x*2); }\n${f}(${rint(1,9)});`; },
  ]),
  EXC: ensureCount([
    () => `FILE *f = fopen("missing.txt","r");\nif (!f) { printf("open failed\\n"); }\nelse { fclose(f); }`,
    () => { const inv=pickVar(), y=pickVar(), x=pickVar();
      return `int ${inv}(int ${x}, int* out){ if(${x}==0) return -1; *out = 1/${x}; return 0; }\nint ${y}; if (${inv}(${rint(0,2)}, &${y})==0) printf("%d\\n", ${y}); else printf("err\\n");`; },
    () => `FILE *g=fopen("t.txt","w"); if(!g){ puts("err"); } else { fputs("x",g); fclose(g);} `,
    () => `int *p=NULL; if(!p) puts("null");`,
    () => `char *s=NULL; if(s) puts(s); else puts("none");`,
    () => `FILE *r=fopen("tmp.txt","r"); if(!r) puts("miss"); else { fclose(r); }`,
    () => `if (${rint(0,1)}) puts("ok"); else puts("err");`,
    () => `int div=${rint(0,1)}; if(div==0) puts("zero"); else printf("%d\\n", 1/div);`,
    () => `if (fopen("x","r")==NULL) puts("nf"); else puts("ok");`,
    () => `/* errno demo would require <errno.h>; omitted for brevity */ puts("0");`,
  ]),
  TYPING: ensureCount([
    () => { const Rect=pickClassName(), w=pickVar(), h=pickVar(); return `typedef struct { int ${w}, ${h}; } ${Rect};\n${Rect} r = {${rint(1,5)}, ${rint(1,5)}};\nprintf("%d\\n", r.${w} * r.${h});`; },
    () => { const Point=pickClassName(), x=pickVar(), y=pickVar(); return `typedef struct { int ${x}, ${y}; } ${Point};\n${Point} p = {${rint(0,3)}, ${rint(0,3)}};\nprintf("%d\\n", p.${x} + p.${y});`; },
    () => `typedef struct { int x; int y; } Pair;\nPair p={1,2}; printf("%d\\n", p.x+p.y);`,
    () => `typedef int (*F)(int); int id(int x){ return x; } F f=id; printf("%d\\n", f(3));`,
    () => `typedef struct { int a[3]; } Arr;\nArr a={{1,2,3}}; printf("%d\\n", a.a[0]);`,
    () => `typedef struct Node{ int v; struct Node* next; } Node; Node n={1,NULL}; printf("%d\\n", n.v);`,
    () => `typedef enum { RED, GREEN, BLUE } Color; printf("%d\\n", GREEN);`,
    () => `typedef unsigned long U; U x=1UL; printf("%lu\\n", x);`,
    () => `typedef struct { char name[8]; } User; User u={"bob"}; printf("%s\\n", u.name);`,
    () => `typedef struct { int r,g,b; } RGB; RGB c={1,2,3}; printf("%d\\n", c.g);`,
  ]),
  IO: ensureCount([
    () => { const fname=`${pickWord()}.txt`; return `FILE *f=fopen("${fname}","w"); fprintf(f,"hi"); fclose(f);\nchar buf[16]; f=fopen("${fname}","r"); fgets(buf,16,f); fclose(f); printf("%s\\n", buf);`; },
    () => `FILE *f=fopen("nums.txt","w"); fprintf(f,"%s","${arrOfNums(5)}"); fclose(f); puts("ok");`,
    () => `FILE *f=fopen("bin.dat","wb"); unsigned char b[]={1,2,3}; fwrite(b,1,3,f); fclose(f); printf("3\\n");`,
    () => `mkdir("d",0777); FILE *g=fopen("d/a.txt","w"); fputs("x",g); fclose(g); puts("ok");`,
    () => `remove("maybe.txt"); puts("clean");`,
    () => `FILE *f2=fopen("log.txt","a"); fputs("x\\n",f2); fclose(f2); puts("ok");`,
    () => `rename("log.txt","renamed.txt"); puts("renamed");`,
    () => `FILE *c2=fopen("copy.txt","w"); fputs("x",c2); fclose(c2); puts("copy");`,
    () => `FILE *r2=fopen("read.txt","w"); fputs("x",r2); fclose(r2); r2=fopen("read.txt","r"); int ch=fgetc(r2); fclose(r2); printf("%c\\n", ch);`,
    () => `FILE *s=fopen("seek.txt","w"); fputs("abc",s); fclose(s); s=fopen("seek.txt","r"); fseek(s,1,SEEK_SET); int ch2=fgetc(s); fclose(s); printf("%c\\n", ch2);`,
  ]),
};

// -------------- Support map (UI hides unsupported modes) --------------
export const SUPPORTED: Record<Lang, Concept[]> = {
  python: [
    "loops","conditionals","functions","exceptions","comprehensions",
    "classes","oop","typing","decorators","io","regex","async",
  ],
  javascript: [
    "loops","conditionals","functions","exceptions","comprehensions",
    "classes","oop","io","regex","async",
  ],
  typescript: [
    "loops","conditionals","functions","exceptions","comprehensions",
    "classes","oop","typing","decorators","io","regex","async",
  ],
  java: [
    "loops","conditionals","functions","exceptions",
    "classes","oop","typing","io","regex",
  ],
  c: [
    "loops","conditionals","functions","exceptions","typing","io",
  ],
};

// -------------- routing + API --------------
const pickN = (arr: Array<() => string>, n: number) =>
  Array.from({ length: n }, () => rand(arr)()).join("\n\n");

function bank(lang: Lang, concept: Concept): Array<() => string> {
  let obj: Bank;

  switch (lang) {
    case "python":
      obj = {
        loops: PY.LOOPS,
        conditionals: PY.CONDITION,
        functions: PY.FUNC,
        exceptions: PY.EXC,
        comprehensions: PY.COMP,
        classes: PY.CLASS,
        oop: PY.OOP,
        typing: PY.TYPING,
        decorators: PY.DEC,
        io: PY.IO,
        regex: PY.REGEX,
        async: PY.ASYNC,
      };
      break;

    case "javascript":
      obj = {
        loops: JS_BASE.LOOPS,
        conditionals: JS_BASE.CONDITION,
        functions: JS_BASE.FUNC,
        exceptions: JS_BASE.EXC,
        comprehensions: JS_BASE.COMP,
        classes: JS_BASE.CLASS,
        oop: JS_BASE.OOP,
        typing: EMPTY,
        decorators: EMPTY,
        io: JS_BASE.IO,
        regex: JS_BASE.REGEX,
        async: JS_BASE.ASYNC,
      };
      break;

    case "typescript":
      obj = {
        loops: JS_BASE.LOOPS,
        conditionals: JS_BASE.CONDITION,
        functions: JS_BASE.FUNC,
        exceptions: JS_BASE.EXC,
        comprehensions: JS_BASE.COMP,
        classes: JS_BASE.CLASS,
        oop: JS_BASE.OOP,
        typing: TS_ONLY.TYPING,
        decorators: TS_ONLY.DECORATORS,
        io: JS_BASE.IO,
        regex: JS_BASE.REGEX,
        async: JS_BASE.ASYNC,
      };
      break;

    case "java":
      obj = {
        loops: JAVA.LOOPS,
        conditionals: JAVA.CONDITION,
        functions: JAVA.FUNC,
        exceptions: JAVA.EXC,
        comprehensions: EMPTY,
        classes: JAVA.CLASS,
        oop: JAVA.OOP,
        typing: JAVA.TYPING,
        decorators: EMPTY,
        io: JAVA.IO,
        regex: JAVA.REGEX,
        async: EMPTY,
      };
      break;

    case "c":
      obj = {
        loops: C.LOOPS,
        conditionals: C.CONDITION,
        functions: C.FUNC,
        exceptions: C.EXC,
        comprehensions: EMPTY,
        classes: EMPTY,
        oop: EMPTY,
        typing: C.TYPING,
        decorators: EMPTY,
        io: C.IO,
        regex: EMPTY,
        async: EMPTY,
      };
      break;
  }

  return obj[concept];
}

export function generateSnippet(concept: Concept, blocks = 3, lang: Lang = "python"): string {
  const b = bank(lang, concept);
  return pickN(b, blocks);
}

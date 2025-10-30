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
  // animals
  "ant","badger","bear","bee","bison","boar","butterfly","camel","cat","cheetah","chicken","cobra","cow",
  "coyote","crab","crane","crow","deer","dog","dolphin","donkey","duck","eagle","eel","elephant","elk","falcon",
  "ferret","flamingo","fox","frog","gazelle","giraffe","goat","goose","gorilla","hamster","hawk","hedgehog",
  "hippo","horse","hyena","iguana","jaguar","jellyfish","kangaroo","koala","lemur","leopard","lion","llama","lobster",
  "lynx","magpie","mole","monkey","moose","moth","mouse","narwhal","octopus","otter","owl","ox","oyster",
  "panda","panther","parrot","pelican","penguin","pigeon","puma","quail","rabbit","raccoon","ray","reindeer","rhino",
  "robin","salamander","seal","shark","sheep","shrimp","skunk","sloth","snail","snake","sparrow","spider","squid",
  "swan","tapir","tiger","toad","turkey","turtle","vulture","walrus","wasp","weasel","whale","wolf","wombat","yak","zebra",
];

// quick helpers
const arrOfNums = (n: number, a = 1, b = 9) => Array.from({ length: n }, () => rint(a, b)).join(", ");
const someWords = (n: number) => Array.from({ length: n }, () => `"${rand(words)}"`).join(", ");
const choose = rand;

// -------------- PYTHON --------------
const PY = {
  LOOPS: [
    () => { const v = choose(varNames); return `for ${v} in range(${rint(3, 12)}):\n${indent()}print(${v})`; },
    () => { const v=choose(varNames), s=rint(0,5), e=s+rint(3,10); return `for ${v} in range(${s}, ${e}):\n${indent()}if ${v} % 2 == 0:\n${indent(2)}continue\n${indent()}print(${v})`; },
    () => { const a=choose(varNames), b=choose(varNames); return `for ${a}, ${b} in zip(range(${rint(3,7)}), range(${rint(3,7)})):\n${indent()}print(${a}+${b})`; },
    () => { const v=choose(varNames), stop=rint(3,8); return `${v}=0\nwhile ${v} <= ${stop}:\n${indent()}print(${v})\n${indent()}${v} += 1`; },
    () => { const v=choose(varNames), stop=rint(4,10); return `${v}=0\nwhile True:\n${indent()}if ${v}==${stop}:\n${indent(2)}break\n${indent()}${v}+=1`; },
    () => { const L=choose(listNames); return `${L}=[${arrOfNums(rint(3,6))}]\nfor idx, x in enumerate(${L}):\n${indent()}if idx==${rint(1,3)}: break\n${indent()}print(idx, x)`; },
    () => { const L=choose(listNames); return `${L}=[${someWords(rint(3,6))}]\nfor s in ${L}:\n${indent()}if "a" in s:\n${indent(2)}continue\n${indent()}print(s.upper())`; },
  ],
  CONDITION: [
    () => `x=${rint(0,10)}\nif x<3:\n${indent()}print("low")\nelif x<7:\n${indent()}print("mid")\nelse:\n${indent()}print("high")`,
    () => { const a=rint(1,9), b=rint(1,9); return `a=${a}; b=${b}\nprint("bigger" if a>b else "smaller or equal")`; },
    () => `s="${rand(words)}"\nprint("yes" if s.startswith("a") else "no")`,
    () => `n=${rint(1,9)}\nprint("even" if n%2==0 else "odd")`,
  ],
  FUNC: [
    () => `def add(a: int, b: int = ${rint(1,5)}) -> int:\n${indent()}return a + b\n\nprint(add(${rint(1,9)}))`,
    () => `def total(*args: int) -> int:\n${indent()}s = 0\n${indent()}for x in args:\n${indent(2)}s += x\n${indent()}return s\n\nprint(total(${arrOfNums(3)}))`,
    () => `def peak(arr):\n${indent()}return max(arr) if arr else None\n\nprint(peak([${arrOfNums(5)}]))`,
    () => `def fizz(n):\n${indent()}return "FizzBuzz" if n%15==0 else ("Fizz" if n%3==0 else ("Buzz" if n%5==0 else n))\n\nprint([fizz(x) for x in range(1,16)])`,
  ],
  EXC: [
    () => `try:\n${indent()}x = int("notnum")\nexcept ValueError:\n${indent()}x = -1\nprint(x)`,
    () => `def inv(x):\n${indent()}if x == 0:\n${indent(2)}raise ZeroDivisionError("nope")\n${indent()}return 1/x\n\ntry:\n${indent()}print(inv(${rint(0,2)}))\nfinally:\n${indent()}print("done")`,
    () => `try:\n${indent()}open("missing.txt")\nexcept FileNotFoundError:\n${indent()}print("missing")\nelse:\n${indent()}print("ok")`,
  ],
  COMP: [
    () => `squares = [x*x for x in range(${rint(4,9)})]\nprint(squares)`,
    () => `evens = {x for x in range(${rint(6,12)}) if x % 2 == 0}\nprint(evens)`,
    () => `d = {c: ord(c) for c in "abcde"}\nprint(d)`,
    () => `pairs=[(x,y) for x in range(3) for y in range(2)]\nprint(pairs)`,
  ],
  CLASS: [
    () => `class Box:\n${indent()}def __init__(self, w, h):\n${indent(2)}self.w=w; self.h=h\n${indent()}def area(self):\n${indent(2)}return self.w*self.h\n\nprint(Box(${rint(1,5)},${rint(1,5)}).area())`,
    () => `class Counter:\n${indent()}def __init__(self, n=0): self.n=n\n${indent()}def inc(self): self.n+=1\n${indent()}def value(self): return self.n\n\nc=Counter(${rint(0,3)}); c.inc(); print(c.value())`,
    () => `class User:\n${indent()}def __init__(self,name): self._name=name\n${indent()}@property\n${indent()}def name(self): return self._name\n\nprint(User("${rand(words)}").name)`,
    () => `class Vector:\n${indent()}def __init__(self,x,y): self.x=x; self.y=y\n${indent()}def add(self,o): return Vector(self.x+o.x,self.y+o.y)\n\nv=Vector(${rint(0,3)},${rint(0,3)}).add(Vector(${rint(0,3)},${rint(0,3)}))\nprint(v.x,v.y)`,
  ],
  OOP: [
    () => `class A:  \n${indent()}def v(self): return 1\nclass B(A):\n${indent()}def v(self): return super().v()+1\nprint(B().v())`,
    () => `class Animal:\n${indent()}def speak(self): raise NotImplementedError\nclass Dog(Animal):\n${indent()}def speak(self): print("woof")\nDog().speak()`,
  ],
  TYPING: [
    () => `from typing import TypeVar, Generic, List\nT=TypeVar("T")\nclass Bag(Generic[T]):\n${indent()}def __init__(self): self.items: List[T]=[]\n${indent()}def add(self,x:T)->None: self.items.append(x)\n\nb=Bag[int](); b.add(3); print(b.items)`,
    () => `from typing import Union\nx: Union[int,str]\nx=${rint(0,1)} or "a"\nprint(x)`,
  ],
  DEC: [
    () => `from functools import wraps\n\ndef log(fn):\n${indent()}@wraps(fn)\n${indent()}def inner(*a,**k):\n${indent(2)}print(fn.__name__)\n${indent(2)}return fn(*a,**k)\n${indent()}return inner\n\n@log\ndef add(a,b): return a+b\nprint(add(1,2))`,
  ],
  IO: [
    () => `with open("data.txt","w",encoding="utf-8") as f:\n${indent()}f.write("hello")\nwith open("data.txt") as f:\n${indent()}print(f.read())`,
  ],
  REGEX: [
    () => `import re\nm=re.findall(r"[a-z]+","ab12cdEF")\nprint(m)`,
    () => `import re\ns=re.sub(r"\\d","*", "a1b2c3")\nprint(s)`,
  ],
  ASYNC: [
    () => `import asyncio\nasync def work(i):\n${indent()}await asyncio.sleep(0)\n${indent()}print(i)\nasync def main():\n${indent()}await work(${rint(1,5)})\nasyncio.run(main())`,
  ],
};

// -------------- JavaScript + TypeScript --------------
const JS_BASE = {
  LOOPS: [
    () => `for (let i = 0; i < ${rint(3,8)}; i++) {\n${indent()}console.log(i);\n}`,
    () => `const ${choose(listNames)}=[${arrOfNums(rint(3,5))}];\nfor (const x of ${listNames[0] || "arr"}) {\n${indent()}if (x % 2 === 0) continue;\n${indent()}console.log(x);\n}`,
    () => `let ${choose(varNames)}=${rint(0,2)};\nwhile (${varNames[0]||"n"} <= ${rint(3,7)}) {\n${indent()}console.log(${varNames[0]||"n"});\n${indent()}${varNames[0]||"n"}++;\n}`,
  ],
  CONDITION: [
    () => `const x=${rint(0,10)};\nif (x < 3) {\n${indent()}console.log("low");\n} else if (x < 7) {\n${indent()}console.log("mid");\n} else {\n${indent()}console.log("high");\n}`,
    () => `const s="${rand(words)}";\nconsole.log(s.startsWith("a") ? "yes" : "no");`,
  ],
  FUNC: [
    () => `function add(a, b = ${rint(1,5)}) { return a + b; }\nconsole.log(add(${rint(1,9)}));`,
    () => `const total = (...args) => args.reduce((a,b)=>a+b,0);\nconsole.log(total(${arrOfNums(3)}));`,
    () => `const fizz = (n) => n%15===0?"FizzBuzz":n%3===0?"Fizz":n%5===0?"Buzz":n;\nconsole.log([...Array(15).keys()].map(i=>fizz(i+1)));`,
  ],
  EXC: [
    () => `try {\n${indent()}JSON.parse("{bad}");\n} catch (e) {\n${indent()}console.log("fail");\n} finally {\n${indent()}console.log("done");\n}`,
    () => `function inv(x){ if(x===0) throw new Error("nope"); return 1/x; }\ntry { console.log(inv(${rint(0,2)})); } catch { console.log("caught"); }`,
  ],
  COMP: [
    () => `const squares = Array.from({length:${rint(4,8)}},(_,i)=>i*i);\nconsole.log(squares);`,
    () => `const odds = [...Array(${rint(6,12)}).keys()].filter(x=>x%2===1);\nconsole.log(odds);`,
    () => `const dict = Object.fromEntries("abcde".split("").map(c=>[c,c.charCodeAt(0)]));\nconsole.log(dict);`,
  ],
  CLASS: [
    () => `class Point { constructor(x,y){ this.x=x; this.y=y; } len(){ return Math.hypot(this.x,this.y); } }
const p = new Point(${rint(1,5)}, ${rint(1,5)});
console.log(p.len());`,
    () => `class Rect { constructor(w,h){ this.w=w; this.h=h; } area(){ return this.w*this.h; } }
console.log(new Rect(${rint(1,5)}, ${rint(1,5)}).area());`,
    () => `class Circle { constructor(r){ this.r=r; } area(){ return Math.PI*this.r*this.r; } }
console.log(new Circle(${rint(1,5)}).area().toFixed(2));`,
    () => `class Queue { constructor(){ this.a=[]; } enqueue(x){ this.a.push(x); } dequeue(){ return this.a.shift(); } }
const q=new Queue(); q.enqueue(${rint(1,9)}); q.enqueue(${rint(1,9)}); console.log(q.dequeue());`,
    () => `class User { #name; constructor(name){ this.#name=name; } get name(){ return this.#name; } }
console.log(new User("${rand(words)}").name);`,
    () => `class Counter { constructor(n=0){ this.n=n; } inc(){ this.n++; } value(){ return this.n; } }
const c=new Counter(${rint(0,3)}); c.inc(); console.log(c.value());`,
    () => `class Logger { constructor(prefix="LOG"){ this.prefix=prefix; } log(msg){ console.log(this.prefix + ":", msg); } }
new Logger("${rand(["INFO","DBG","APP"])}").log("${rand(words)}");`,
    () => `class Stack { constructor(){ this.s=[]; } push(x){ this.s.push(x); } pop(){ return this.s.pop(); } size(){ return this.s.length; } }
const s=new Stack(); s.push(${rint(1,9)}); s.push(${rint(1,9)}); console.log(s.size());`,
  ],
  OOP: [
    () => `class A{ value(){ return 1; }}\nclass B extends A{ value(){ return super.value()+1; }}\nconsole.log(new B().value());`,
    () => `class Animal{ speak(){ throw new Error("NI"); }}\nclass Dog extends Animal{ speak(){ console.log("woof"); }}\nnew Dog().speak();`,
  ],
  IO: [
    () => `// Node.js\nconst fs=require("fs");\nfs.writeFileSync("out.txt","hi");\nconsole.log(fs.readFileSync("out.txt","utf8"));`,
  ],
  REGEX: [
    () => `const m="ab12cdEF".match(/[a-z]+/g); console.log(m);`,
    () => `console.log("a1b2c3".replace(/\\d/g,"*"));`,
  ],
  ASYNC: [
    () => `const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));\n(async()=>{ await sleep(0); console.log(${rint(1,5)}); })();`,
    () => `async function fetchNum(){ return ${rint(1,9)}; }\n(async()=>{ const [a,b]=await Promise.all([fetchNum(),fetchNum()]); console.log(a+b); })();`,
  ],
};

const TS_ONLY = {
  TYPING: [
    () => `function pair<T>(a:T,b:T):[T,T]{ return [a,b]; }\nconst p = pair<number>(${rint(1,5)}, ${rint(6,9)});\nconsole.log(p);`,
    () => `interface User{ id:number; name:string; }\nconst u:User={id:1,name:"a"}; console.log(u.name);`,
    () => `type NumOrStr = number | string; let x: NumOrStr = ${rint(0,1)} ? ${rint(1,9)} : "hi"; console.log(x);`,
  ],
  DECORATORS: [
    () => `function log(target:any, key:string, desc:PropertyDescriptor){ const orig=desc.value; desc.value=function(...a:any[]){ console.log(key); return orig.apply(this,a); }; }\nclass A{ @log greet(){ console.log("hi"); } }\nnew A().greet();`,
  ],
};

// -------------- Java --------------
const JAVA = {
  LOOPS: [
    () => `for (int i = 0; i < ${rint(3,8)}; i++) {\n${indent()}System.out.println(i);\n}`,
    () => `int i = 0;\nwhile (i <= ${rint(3,7)}) {\n${indent()}System.out.println(i);\n${indent()}i++;\n}`,
  ],
  CONDITION: [
    () => `int x=${rint(0,10)};\nif (x<3) {\n${indent()}System.out.println("low");\n} else if (x<7) {\n${indent()}System.out.println("mid");\n} else {\n${indent()}System.out.println("high");\n}`,
    () => `String s="${rand(words)}";\nSystem.out.println(s.startsWith("a")?"yes":"no");`,
  ],
  FUNC: [
    () => `static int add(int a,int b){ return a+b; }\nSystem.out.println(add(${rint(1,5)},${rint(1,5)}));`,
    () => `static int total(int... xs){ int s=0; for(int x:xs) s+=x; return s; }\nSystem.out.println(total(${arrOfNums(3)}));`,
  ],
  EXC: [
    () => `try {\n${indent()}int x=Integer.parseInt("NaN");\n${indent()}System.out.println(x);\n} catch (NumberFormatException e) {\n${indent()}System.out.println("fail");\n} finally {\n${indent()}System.out.println("done");\n}`,
    () => `static int inv(int x){ if(x==0) throw new ArithmeticException("nope"); return 1/x; }\ntry{ System.out.println(inv(${rint(0,2)})); } catch (ArithmeticException e){ System.out.println("caught"); }`,
    () => `try{\n${indent()}java.nio.file.Files.readString(java.nio.file.Path.of("missing.txt"));\n} catch(java.io.IOException e){\n${indent()}System.out.println("missing");\n}`,
  ],
  CLASS: [
    () => `class Point { int x,y; Point(int x,int y){this.x=x;this.y=y;} double len(){ return Math.hypot(x,y); } }\nSystem.out.println(new Point(${rint(1,5)},${rint(1,5)}).len());`,
    () => `class Rect { int w,h; Rect(int w,int h){this.w=w;this.h=h;} int area(){ return w*h; } }\nSystem.out.println(new Rect(${rint(1,5)},${rint(1,5)}).area());`,
    () => `class Counter{ int n; Counter(int n){this.n=n;} void inc(){n++;} int value(){return n;} }\nCounter c=new Counter(${rint(0,3)}); c.inc(); System.out.println(c.value());`,
    () => `class User{ private final String name; User(String n){this.name=n;} String name(){return name;} }\nSystem.out.println(new User("${rand(words)}").name());`,
  ],
  OOP: [
    () => `class A{ int v(){return 1;} }\nclass B extends A{ int v(){ return super.v()+1; } }\nSystem.out.println(new B().v());`,
    () => `abstract class Animal{ abstract void speak(); }\nclass Dog extends Animal{ void speak(){ System.out.println("woof"); } }\nnew Dog().speak();`,
  ],
  TYPING: [
    () => `class Box<T>{ T v; Box(T v){this.v=v;} T get(){return v;} }\nSystem.out.println(new Box<Integer>(42).get());`,
    () => `record Pair<A,B>(A a,B b){}\nPair<Integer,String> p=new Pair<>(1,"a");\nSystem.out.println(p.a()+","+p.b());`,
  ],
  IO: [
    () => `java.nio.file.Files.writeString(java.nio.file.Path.of("out.txt"),"hi");\nSystem.out.println(java.nio.file.Files.readString(java.nio.file.Path.of("out.txt")));`,
  ],
  REGEX: [
    () => `java.util.regex.Pattern p=java.util.regex.Pattern.compile("[a-z]+");\njava.util.regex.Matcher m=p.matcher("ab12cdEF");\nwhile(m.find()) System.out.println(m.group());`,
  ],
};

// -------------- C --------------
const C = {
  LOOPS: [
    () => `for (int i=0; i<${rint(3,8)}; i++) {\n${indent()}printf("%d\\n", i);\n}`,
    () => `int i=0;\nwhile (i <= ${rint(3,7)}) {\n${indent()}printf("%d\\n", i);\n${indent()}i++;\n}`,
  ],
  CONDITION: [
    () => `int x=${rint(0,10)};\nif (x<3) {\n${indent()}printf("low\\n");\n} else if (x<7) {\n${indent()}printf("mid\\n");\n} else {\n${indent()}printf("high\\n");\n}`,
    () => `char *s="${rand(words)}";\nprintf("%s\\n", s[0]=='a' ? "yes" : "no");`,
  ],
  FUNC: [
    () => `int add(int a,int b){ return a+b; }\nprintf("%d\\n", add(${rint(1,5)},${rint(1,5)}));`,
    () => `int total(int *a,int n){ int s=0; for(int i=0;i<n;i++) s+=a[i]; return s; }\nint xs[] = {${arrOfNums(3)}};\nprintf("%d\\n", total(xs,3));`,
  ],
  EXC: [
    () => `FILE *f=fopen("missing.txt","r");\nif(!f){ printf("open failed\\n"); }\nelse{ fclose(f); }`,
    () => `int inv(int x,int* out){ if(x==0) return -1; *out=1/x; return 0; }\nint y; if(inv(${rint(0,2)},&y)==0) printf("%d\\n",y); else printf("err\\n");`,
  ],
  TYPING: [
    () => `typedef struct { int w,h; } Rect;\nRect r={${rint(1,5)},${rint(1,5)}};\nprintf("%d\\n", r.w*r.h);`,
    () => `typedef struct { int x,y; } Point; Point p={${rint(0,3)},${rint(0,3)}}; printf("%d\\n", p.x+p.y);`,
  ],
  IO: [
    () => `FILE *f=fopen("out.txt","w"); fprintf(f,"hi"); fclose(f);\nchar buf[16]; f=fopen("out.txt","r"); fgets(buf,16,f); fclose(f); printf("%s\\n",buf);`,
  ],
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

// replace your whole bank() with this version
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
        typing: EMPTY,          // unsupported in JS
        decorators: EMPTY,      // TS-only
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
        comprehensions: EMPTY,  // not in your Java bank
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

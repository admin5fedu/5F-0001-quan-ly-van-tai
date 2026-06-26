import { db } from './qa-lib.mjs';
const { data: d116 } = await db.from('var_nhan_vien').select('id, ho_va_ten, ten_dang_nhap, id_xe_mac_dinh, email').eq('id', 116).single();
console.log('Driver 116:', JSON.stringify(d116));
// drivers having id_xe_mac_dinh for task 7
const { data: drv } = await db.from('var_nhan_vien').select('id, ho_va_ten, ten_dang_nhap, id_xe_mac_dinh').not('id_xe_mac_dinh','is',null).limit(5);
console.log('Drivers with default vehicle:', JSON.stringify(drv));
// xe list
const { data: xe } = await db.from('vt_xe').select('id, bien_so, hang').limit(5);
console.log('Vehicles:', JSON.stringify(xe));

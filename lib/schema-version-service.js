'use strict';
const GPS_VERSION='v4-p0-gps-001',GPS_CHECKSUM='0f0c1322c084ea2b90fbc5ff40d02e7c15c655b50bde748cc9ab0eac23965296';
async function assertGps(sql){
 try{const rows=await sql.query('select checksum from gs_schema_migrations where version=$1',[GPS_VERSION]);if(rows[0]?.checksum!==GPS_CHECKSUM)throw Error();}
 catch{throw Object.assign(Error('Esquema GPS não preparado. Execute a migração controlada no ambiente isolado.'),{authStatus:503,code:'SCHEMA_NOT_READY'});}
}
module.exports={GPS_VERSION,GPS_CHECKSUM,assertGps};

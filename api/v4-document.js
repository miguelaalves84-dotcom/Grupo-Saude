'use strict';
/* Preserve the old URL; private retrieval uses the same policy/storage/audit as Finance. */
module.exports=(req,res)=>{
 req.query={...req.query,action:'document'};
 return require('./v4-finance')(req,res);
};

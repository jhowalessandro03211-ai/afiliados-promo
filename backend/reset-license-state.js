import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename=fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);
const f=path.join(__dirname,"license-state.json");
if(fs.existsSync(f)){fs.unlinkSync(f);console.log("Estado de revogação removido.");}
else console.log("Nenhum estado de revogação encontrado.");
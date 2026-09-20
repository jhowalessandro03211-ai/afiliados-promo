import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const bindingFile = path.join(__dirname, "license-binding.json");

if (!fs.existsSync(bindingFile)) {
  console.log("Nenhum vínculo encontrado.");
  process.exit(0);
}

fs.unlinkSync(bindingFile);
console.log("Vínculo de licença removido.");
console.log("Na próxima ativação válida, a licença será vinculada à nova instalação.");
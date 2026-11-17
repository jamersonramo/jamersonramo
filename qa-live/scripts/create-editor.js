#!/usr/bin/env node
// Cria (ou atualiza a senha de) um editor. Le as credenciais de variaveis de
// ambiente de proposito: a senha nunca deve ficar hardcoded em um arquivo
// versionado no git.
//
// Uso:
//   EDITOR_EMAIL="voce@empresa.com" EDITOR_PASSWORD="sua-senha" node scripts/create-editor.js

const repo = require('../server/db/repo');
const { hashPassword } = require('../server/auth');
const db = require('../server/db');

const email = process.env.EDITOR_EMAIL;
const password = process.env.EDITOR_PASSWORD;

if (!email || !password) {
  console.error('Defina EDITOR_EMAIL e EDITOR_PASSWORD como variaveis de ambiente.');
  process.exit(1);
}

const passwordHash = hashPassword(password);
const existing = repo.getEditorByEmail(email);

if (existing) {
  db.prepare('UPDATE editors SET password_hash = ? WHERE id = ?').run(passwordHash, existing.id);
  console.log(`Senha atualizada para o editor ${email}.`);
} else {
  repo.createEditor(email, passwordHash);
  console.log(`Editor ${email} criado.`);
}

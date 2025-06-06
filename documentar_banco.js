const mysql = require('mysql2/promise');

async function documentarBanco() {
  let conexao;
  try {
    conexao = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '1234',
      database: 'projetofgt',
      port: 3306
    });

    console.log('# DOCUMENTAÇÃO DO BANCO DE DADOS - PROJETO FGT\n');

    // Listar todas as tabelas
    const [tabelasRows] = await conexao.execute('SHOW TABLES');
    const tabelas = tabelasRows.map(row => Object.values(row)[0]);

    console.log('## TABELAS ENCONTRADAS:');
    tabelas.forEach(tabela => console.log(`- ${tabela}`));
    console.log('\n---\n');

    // Analisar estrutura de cada tabela
    for (const tabela of tabelas) {
      console.log(`## TABELA: ${tabela.toUpperCase()}\n`);
      
      // Estrutura da tabela
      const [colunas] = await conexao.execute(`DESCRIBE \`${tabela}\``);
      console.log('### Estrutura:');
      console.log('| Campo | Tipo | Null | Chave | Padrão | Extra |');
      console.log('|-------|------|------|-------|--------|-------|');
      
      colunas.forEach(col => {
        console.log(`| ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key || '-'} | ${col.Default || 'NULL'} | ${col.Extra || '-'} |`);
      });

      // Contar registros
      try {
        const [count] = await conexao.execute(`SELECT COUNT(*) as total FROM \`${tabela}\``);
        console.log(`\n**Total de registros:** ${count[0].total}\n`);
      } catch (err) {
        console.log('\n**Erro ao contar registros**\n');
      }

      // Exemplos de dados (primeiros 3 registros)
      try {
        const [exemplos] = await conexao.execute(`SELECT * FROM \`${tabela}\` LIMIT 3`);
        if (exemplos.length > 0) {
          console.log('### Exemplos de dados:');
          console.log('```json');
          exemplos.forEach((exemplo, index) => {
            console.log(`// Registro ${index + 1}:`);
            console.log(JSON.stringify(exemplo, null, 2));
          });
          console.log('```\n');
        }
      } catch (err) {
        console.log('**Erro ao buscar exemplos de dados**\n');
      }

      console.log('---\n');
    }

    // Informações sobre índices e chaves estrangeiras
    console.log('## ÍNDICES E CHAVES ESTRANGEIRAS\n');
    
    for (const tabela of tabelas) {
      try {
        const [indices] = await conexao.execute(`SHOW INDEX FROM \`${tabela}\``);
        if (indices.length > 0) {
          console.log(`### ${tabela}:`);
          indices.forEach(index => {
            console.log(`- **${index.Key_name}**: ${index.Column_name} (${index.Index_type})`);
          });
          console.log('');
        }
      } catch (err) {
        console.log(`Erro ao buscar índices para ${tabela}\n`);
      }
    }

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    if (conexao) {
      await conexao.end();
      console.log('\n**Análise concluída.**');
    }
  }
}

documentarBanco();

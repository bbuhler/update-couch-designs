module.exports =
{
  _id: "_design/test",
  language: "javascript",

  validate_doc_update(newDoc, savedDoc, userCtx)
  {
    if (userCtx.name === null)
    {
      throw { forbidden: 'Only logged-in users are allowed to create new documents.' };
    }
  },

  views:
  {
    comments:
    {
      map(doc)
      {
        emit(doc._id, doc._rev);
      },
      reduce(keys, values, rereduce)
      {
        if (rereduce)
        {
          return sum(values);
        } 
        else
        {
          return values.length;
        }
      }
    }
  },

  shows:
  {
    post(doc, req)
    {
      return `<h1>${doc.title}</h1>`;
    }
  },

  lists:
  {
    table(head, req)
    {
      start({ headers: { 'Content-Type': 'text/html' } });
      send('<html><body><table>');
      send('<tr><th>ID</th><th>Key</th><th>Value</th></tr>');
      while(row = getRow())
      {
        send(''.concat(
          '<tr>',
          '<td>' + toJSON(row.id) + '</td>',
          '<td>' + toJSON(row.key) + '</td>',
          '<td>' + toJSON(row.value) + '</td>',
          '</tr>'
        ));
      }
      send('</table></body></html>');
    }
  },

  updates:
  {
    last_modified(doc, req)
    {
      doc.last_modified = Date.now();
      return [doc, toJSON(doc)];
    }
  },

  filters:
  {
    important(doc, req)
    {
      return doc.priority == 'high';
    }
  }
};

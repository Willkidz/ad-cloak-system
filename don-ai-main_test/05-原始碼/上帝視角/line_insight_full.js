
const prev = $input.first().json;
const parsedData = JSON.parse(prev.data);
const yesterday = prev.yesterday;

const LINE_TOKENS = {"n20": "IhalgO6KC+EncElMWofdJcThr6NI9ApsIk48nfe6ldcxUbxGjgdIdiVsr7W8W+/GmgQr82xJ2cixTk5GTBlYd5XCIrkKZ7o3IixeYHH2rkLvnseqPQE+PCxlAaSJI229Vdzgfun+goch6MDhDx0oEAdB04t89/1O/w1cDnyilFU=", "n21": "CuoCnfhxOyAz0O17XUgbb6PdH4BGuO2iTGyFzonZN1htWDcetna9SaYytdXhMPtN3FcT+w4Oo+IVVvWvj1uHjDZbADiMNW5jlzStw6luqnMtW0gSjP71Q/PW979azTHEJRFxPoxeCJbVMzfpuYLubAdB04t89/1O/w1cDnyilFU=", "n19": "BMpbf0kwXVhfI6K7gr2kIRF0hxa7VwfBghn8k9ti8vePKcIVMlRBhokmYIrjGzlvWbP/o+MwO2UO1+NFcJ5+Wjd1QlSTuo2wc7dAojanyHd/OVgG5nLHfsU0s7XN+5rwPYsEeipfSihc2M3sDlbP/AdB04t89/1O/w1cDnyilFU=", "n18": "gsO5fv7Wt2ufC/QrNaC0vq/0hiaoVMQL+t7Z+5eYBeNJlz9isf6snpUl39v6P2g5d11MKbidhDV7ywt7Cy3O0dL9vhtyeKhJ2xxARrWCSN5aXDL2vuN00yzQ3AIm6yUk9MXEitXSvjgivqaYwyt8owdB04t89/1O/w1cDnyilFU=", "n17": "TtE4VvErVtvV/OQV6IJkiIJqzCxoFXFtc/BxtnaYXO3YiMVeAD0Z7o4Swf9Uqko5zhei9LlmGhr5poovskXzgyw+QqhtxAO6klozN96w0L/vC2Qh6uM4tJDMJOfpVgX1naLTJZrVx67SyqpbamsjHAdB04t89/1O/w1cDnyilFU=", "n16": "xnwdQufji28FGesTzvsHYfNNJGbxJcBG6KdX/6o1iFEujxf7dmYva+64JUER1KHqt+MTpi3WhMHAPHJoPChph+GKcuNzP8YZd1wvEfoBAdNB0v4V3WRVA2hfG02bfICaAobkiQ9KImMjntohUcAW6wdB04t89/1O/w1cDnyilFU=", "n15": "kI/1fsd7Wcz0oo5D+NxDo/tjdMh+rvCKc93fPovl5/Va4ewcjckAwgML8hmxPObIzU5+3m4YO93KDQSwmhsrOvafRRO9xSfXBz7PjQUbjnpOeHXTxbB6q4cubRQjEqMuhUyvV/IXOls0XTa6yf3+NQdB04t89/1O/w1cDnyilFU=", "n14": "dYiKzP3gHEaMqHxO+hH83ggNeST5wdA9tUSifxhd/0RHJmYAJRT8AsfwS/F5HZs5I7CZa1JFTWa2AJd/7/hVvHyLJvV0ztRVXfS7qd45CwOCct0PZ9eKLzVpHPUsAdZvwDrIg3I7kE66ftYBK2sPCgdB04t89/1O/w1cDnyilFU=", "jd": "lAfIpnD9+WP3NFu66LffkI8pVtiNPEL4gQOcJreSbNIV/bHMYRbpj+mcXXJL7HRpV2hU/t4JWObts5GpNZTv2R7gxcadziMkDXA03EL9Ug8Wf0+wclADWdaaJWOUsbLyYQpqu2LEQY7VimP2xpQNbwdB04t89/1O/w1cDnyilFU=", "bf": "MG3EppiUV4nbAKbMZWqiBGSOfz2Gatbp+fFMXHh9DtcveoybQTQ7HPs6sLBp2NUXKY0i3rsThMKen7qEAFlH9DtUi15Ur9zyLlZYSXlZTD1SCXkbR7boUDabxWdKTPXUOtxS5V3RqxlSVrHLxMktnwdB04t89/1O/w1cDnyilFU=", "cx": "vVRtL+t4/bNRjflvL6O5F06DFsnChjZWXAf5ubJiTejeObRwWayYlvZ/unARZYdgZhGR8GJg5nOiZ9I3s7PDpK9ABY7E96OTlFu8yLFIfR6ZPWhJOAk/hCXd7xKojKDHtm0Wi6+AI6K1EjHqJ/IrSAdB04t89/1O/w1cDnyilFU=", "jx": "Wxk3jUzLUtFwoS5hBMulTuHvuAeHloa4cNxs8OgJZ3+nPyaF9h0lEasyE3adu7T2oury8f2i+905dShSPKJu5WiN1xX1TDovbedH8SclrV4aCvYfswtlkz8fIaQA21qMPp5FZSyTfwn68BGokrPsmAdB04t89/1O/w1cDnyilFU=", "n22": "U/MEszkcJ58j5iYBaAiCxWpMdTFe0JS6MkEyySOLpQj81wDFivvG8TyyDBciOFrIA2WS6rmYZ3w7yZwkeGgoWaZzDuY86F9EGo3glpT/c7VEZ59P5lzseYaTJ56GqPXt/8vMXnnXFTX27MxGL2OEiAdB04t89/1O/w1cDnyilFU=", "lx": "xQpu++MOLLvQRks0CV5XEKGJTbYIeZSi5RJkNCyoOuwaHt96tBehoKurIEh/S2BzAl7rfflsuqgS6TcAwyiAO1hDhHpHZC+mOEnVc5vmy4fI4KSd8TwYPk2Te8QsyW1Ls8sOu29tJM/LQf1MzJ0GbgdB04t89/1O/w1cDnyilFU=", "mx": "vMpjLiPbA4kVm5rczKAODQReWrajOcaZWqOEYTwMzgI/16H/ieJqnXY/mlxXkW5GoAgHlD0VsXAiyPHeeUxM+ZK/gDaExmjKEjTsol9bqmilS4Y3gfdF3lh9Ll7SfcjGjvjSmnJzBORoEiF49pDbaQdB04t89/1O/w1cDnyilFU=", "cs": "dvEdEP8a80tGP4wdobKmsv//MZoBJJjYwsu99R167MirrJSto6xdSzJTy8ybQSnFqjewl1wDArf8woZRpjULhsKWZryIcoid2bvMVu0diPb7tWcwzs4kMLTnl8ftNeW/tr1nFJu1vvJqGyDZXxoqpwdB04t89/1O/w1cDnyilFU=", "js": "WA0AAyabp495wh0FGa+O0hyCKxu24SIFfUdvYq+XCvYRWS+2mYHobHGBxRyvo+wh+ddEVMOjTacypAulP4b9l/qb4KxdfJnE9IYw1Hp0w/g3vpY9C0yDAT2ypGtARctnM1sp3+9TB0H1Ky1ltDoPtwdB04t89/1O/w1cDnyilFU=", "ls": "vQqd7yTXJvJ0lr1GE6jIybygry6MKp8FU+/X3fqolqzyL3th9vjYrmaxgJzhUz5zuKuwlK77Nke6q9pfJ3wmmGTPlaNx+oXC5CYgQn9CthPA4GYlDSvTtCPzn6wViZnCHJgHuFTU/utlKoX07H/KogdB04t89/1O/w1cDnyilFU=", "ms": "0+1SDnFis1yWjkeHMk6+F/s71U8wJryGRTGKMOdRN/vRAsAap3IzngaVTqs4e0cELDENZmSHfaDOwBYGbbzg5CTmyCIfhYw09mbr1nSeQIcgqKflOk+dt41H5RZzk4hSYwli4jCsaYzBKxxbm9iHqAdB04t89/1O/w1cDnyilFU=", "cb": "WlRCzUPD+Y0Hda25W0T7GOOHczo6Po5icJHcp+auugiwrYQn+ZPzNKJwHZhoaonsbY2+kRDV3c108FPLpinNrPwIFY9Iz3XpueDHypnEeUoUH8kkqbIAiDGgS4dvH9qWIlIUAPETn9f4WZp/xW/CFwdB04t89/1O/w1cDnyilFU=", "jb": "X3yyU+FyGAMNz7XFZIJz7KvoFtlrlVLT61TI9g9nXK2m6V8RAlsT8LR8XyVv6hbw0s5v04d7xOAv8q2i4Peb2FSLa5PzRa/XGF36R6GNAI8EzND2DxudimpWtZ0xCmCq0Pl0Gx7TishapqKfKe5kMAdB04t89/1O/w1cDnyilFU=", "lb": "PTq4JsnqaY2Iv6YsQGlJ8Scm7RuXwS/r5rKOdVxLPLjfm0CqYCA5Uz0+6AIuNrgqVVjGZItFq00TM3rFE5eRKMbpv9EN4D1SCH9Z5d44oX9VWzHoUiafpxF9k0C7kOfIBOd4F5U3e6/sCwzrXJjfkQdB04t89/1O/w1cDnyilFU=", "mb": "NB+/nMgRv8sIocIFk5qN7n5dwoeiLb0X7B6zidMvDJPun8yB6jOTx42OcejwsVgO8y8Gwk/ddQ8HViADMu4/rMyHxJ6kmObbQr5dt0wn6cEXO1Bxm+WZ/8W3yuiSgfAszddfGk5kC+XrqDuOTt0A/gdB04t89/1O/w1cDnyilFU="};

const series = {
  '爆分王 S': ['js', 'cs', 'ms', 'ls'],
  '莊家剋星 B': ['jb', 'cb', 'mb', 'lb'],
  '獨角仙 X': ['jx', 'cx', 'mx', 'lx']
};

const twNow = new Date(Date.now() + 8 * 3600000);
const yestDate = new Date(twNow - 86400000).toISOString().slice(0, 10).replace(/-/g, '');
const dbDate = new Date(twNow - 2 * 86400000).toISOString().slice(0, 10).replace(/-/g, '');

const insightData = {};
for (const tag of Object.keys(LINE_TOKENS)) {
  try {
    const [r1, r2] = await Promise.all([
      fetch('https://api.line.me/v2/bot/insight/followers?date=' + yestDate, {
        headers: { 'Authorization': 'Bearer ' + LINE_TOKENS[tag] }
      }),
      fetch('https://api.line.me/v2/bot/insight/followers?date=' + dbDate, {
        headers: { 'Authorization': 'Bearer ' + LINE_TOKENS[tag] }
      })
    ]);
    const d1 = await r1.json();
    const d2 = await r2.json();
    if (d1.status === 'ready' && d2.status === 'ready') {
      insightData[tag] = Math.max(0, (d1.followers - d2.followers) + (d1.blocks - d2.blocks));
    } else {
      insightData[tag] = 0;
    }
  } catch (e) {
    insightData[tag] = 0;
  }
}

let msg2 = '📈 歸因率報告\n';
msg2 += '📅 ' + yesterday + '（LINE Insight 延遲1天）\n\n<pre>';
msg2 += '系列           歸因  實際  歸因率\n';
msg2 += '──────────────────────────────────\n';

let gm = 0, ga = 0;
const grouped = new Set(Object.values(series).flat());

for (const [name, tags] of Object.entries(series)) {
  let sm = 0, sa = 0;
  for (const t of tags) {
    sm += parsedData[t]?.[yesterday]?.matched || 0;
    sa += insightData[t] || 0;
  }
  const rate = sa > 0 ? Math.round(sm / sa * 100) + '%' : '-';
  msg2 += name.padEnd(13) + String(sm).padStart(4) + '  ' + String(sa).padStart(4) + '  ' + rate.padStart(5) + '\n';
  gm += sm; ga += sa;
}

let solM = 0, solA = 0;
for (const t of Object.keys(parsedData)) {
  if (!grouped.has(t)) {
    solM += parsedData[t]?.[yesterday]?.matched || 0;
    solA += insightData[t] || 0;
  }
}
if (solM > 0 || solA > 0) {
  const rate = solA > 0 ? Math.round(solM / solA * 100) + '%' : '-';
  msg2 += '獨立項目'.padEnd(13) + String(solM).padStart(4) + '  ' + String(solA).padStart(4) + '  ' + rate.padStart(5) + '\n';
  gm += solM; ga += solA;
}

msg2 += '──────────────────────────────────\n';
const gr = ga > 0 ? Math.round(gm / ga * 100) + '%' : '-';
msg2 += '合計'.padEnd(13) + String(gm).padStart(4) + '  ' + String(ga).padStart(4) + '  ' + gr.padStart(5) + '\n';
msg2 += '</pre>\n<i>歸因=D1匹配數 實際=LINE新增好友</i>';
msg2 += '\n<i>歸因率=歸因÷實際添加</i>';

return [{ json: { msg1: prev.msg1, msg2 } }];

---
title: "LINE 官方帳號 Channel Access Token 列表"
category: "project"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "整理 24 個 LINE 官方帳號的 Channel Access Token 列表，用於 n8n 訊息發送與自動化串接。包含 AS/AB/AX/BF/JD/N 等產品線的 Token 記錄。"
id: "20260328-godview-line-oa-tokens"
type: "spec"
tags: [credentials, godview, line, n8n]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 本文件彙整了上帝視角系統中 24 個 LINE 官方帳號的 Channel Access Token。這些 Token 是 n8n 透過 Messaging API 發送歸因訊息、歡迎語及自動化回覆的核心憑證。**重要警告**：表格中除了第一組 Token 外，其餘 Token 的後段內容（`AdB04t89/1O/w1cDnyilFU=`）完全相同，極大機率為測試填充資料或已失效，在正式環境使用前**必須**重新從 LINE Developers Console 獲取並驗證。

# LINE OA Tokens

## Token 列表

<boundaries id="token-validity-warning">
**注意**：下表中的 Token 存在高度重複性（後段簽名部分一致），建議僅將其視為格式參考。在進行系統串接時，請務必確認每個 LINE ID 對應的 Token 是否有效。
</boundaries>

| LINE ID   | 產品線 | Token (Channel Access Token) |
| :-------- | :--- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| @348ikfwm | N20 | IhalgO6KC+EncElMWofdJcThr6NI9ApsIk48nfe6ldcxUbxGjgdIdiVsr7W8W+/GmgQr82xJ2cixTk5GTBlYd5XCIrkKZ7o3IixeYHH2rkLvnseqPQE+PCxlAaSJI229Vdzgfun+goch6MDhDx0oEAdB04t89/1O/w1cDnyilFU= |
| @942tkadn | - | +0C8PkT+2bzl4n25lbkZ4UX0t38dr56N4FBVX1Q4dNGviCgsybEuE3LvZGsJKgAj/NsN2v8mHtdy+gX2Xt4qGjtuQ81Sl2SMAp97hfRfLGBRrKQ3wizyJUEIgl1BRY2PzXwUP8vsqyZbzgjYlUxdewdB04t89/1O/w1cDnyilFU= |
| @075cocov | - | CuoCnfhxOyAz0O17XUgbb6PdH4BGuO2iTGyFzonZN1htWDcetna9SaYytdXhMPtN3FcT+w4Oo+IVVvWvj1uHjDZbADiMNW5jlzStw6luqnMtW0gSjP71Q/PW979azTHEJRFxPoxeCJbVMzfpuYLubAdB04t89/1O/w1cDnyilFU= |
| @536uhfpf | - | BMpbf0kwXVhfI6K7gr2kIRF0hxa7VwfBghn8k9ti8vePKcIVMlRBhokmYIrjGzlvWbP/o+MwO2UO1+NFcJ5+Wjd1QlSTuo2wc7dAojanyHd/OVgG5nLHfsU0s7XN+5rwPYsEeipfSihc2M3sDlbP/AdB04t89/1O/w1cDnyilFU= |
| @013rgbjl | N18 | gsO5fv7Wt2ufC/QrNaC0vq/0hiaoVMQL+t7Z+5eYBeNJlz9isf6snpUl39v6P2g5d11MKbidhDV7ywt7Cy3O0dL9vhtyeKhJ2xxARrWCSN5aXDL2vuN00yzQ3AIm6yUk9MXEitXSvjgivqaYwyt8owdB04t89/1O/w1cDnyilFU= |
| @106tndmh | - | TtE4VvErVtvV/OQV6IJkiIJqzCxoFXFtc/BxtnaYXO3YiMVeAD0Z7o4Swf9Uqko5zhei9LlmGhr5poovskXzgyw+QqhtxAO6klozN96w0L/vC2Qh6uM4tJDMJOfpVgX1naLTJZrVx67SyqpbamsjHAdB04t89/1O/w1cDnyilFU= |
| @751tggmd | - | xnwdQufji28FGesTzvsHYfNNJGbxJcBG6KdX/6o1iFEujxf7dmYva+64JUER1KHqt+MTpi3WhMHAPHJoPChph+GKcuNzP8YZd1wvEfoBAdNB0v4V3WRVA2hfG02bfICaAobkiQ9KImMjntohUcAW6wdB04t89/1O/w1cDnyilFU= |
| @745jaffa | - | kI/1fsd7Wcz0oo5D+NxDo/tjdMh+rvCKc93fPovl5/Va4ewcjckAwgML8hmxPObIzU5+3m4YO93KDQSwmhsrOvafRRO9xSfXBz7PjQUbjnpOeHXTxbB6q4cubRQjEqMuhUyvV/IXOls0XTa6yf3+NQdB04t89/1O/w1cDnyilFU= |
| @416nbqjl | N14 | dYiKzP3gHEaMqHxO+hH83ggNeST5wdA9tUSifxhd/0RHJmYAJRT8AsfwS/F5HZs5I7CZa1JFTWa2AJd/7/hVvHyLJvV0ztRVXfS7qd45CwOCct0PZ9eKLzVpHPUsAdZvwDrIg3I7kE66ftYBK2sPCgdB04t89/1O/w1cDnyilFU= |
| @520ufhmw | JD | lAfIpnD9+WP3NFu66LffkI8pVtiNPEL4gQOcJreSbNIV/bHMYRbpj+mcXXJL7HRpV2hU/t4JWObts5GpNZTv2R7gxcadziMkDXA03EL9Ug8Wf0+wclADWdaaJWOUsbLyYQpqu2LEQY7VimP2xpQNbwdB04t89/1O/w1cDnyilFU= |
| @678eohsd | BF | MG3EppiUV4nbAKbMZWqiBGSOfz2Gatbp+fFMXHh9DtcveoybQTQ7HPs6sLBp2NUXKY0i3rsThMKen7qEAFlH9DtUi15Ur9zyLlZYSXlZTD1SCXkbR7boUDabxWdKTPXUOtxS5V3RqxlSVrHLxMktnwdB04t89/1O/w1cDnyilFU= |
| @697jsdma | CX | vVRtL+t4/bNRjflvL6O5F06DFsnChjZWXAf5ubJiTejeObRwWayYlvZ/unARZYdgZhGR8GJg5nOiZ9I3s7PDpK9ABY7E96OTlFu8yLFIfR6ZPWhJOAk/hCXd7xKojKDHtm0Wi6+AI6K1EjHqJ/IrSAdB04t89/1O/w1cDnyilFU= |
| @652ahjmy | JX | Wxk3jUzLUtFwoS5hBMulTuHvuAeHloa4cNxs8OgJZ3+nPyaF9h0lEasyE3adu7T2oury8f2i+905dShSPKJu5WiN1xX1TDovbedH8SclrV4aCvYfswtlkz8fIaQA21qMPp5FZSyTfwn68BGokrPsmAdB04t89/1O/w1cDnyilFU= |
| @659jgxlp | N22 | U/MEszkcJ58j5iYBaAiCxWpMdTFe0JS6MkEyySOLpQj81wDFivvG8TyyDBciOFrIA2WS6rmYZ3w7yZwkeGgoWaZzDuY86F9EGo3glpT/c7VEZ59P5lzseYaTJ56GqPXt/8vMXnnXFTX27MxGL2OEiAdB04t89/1O/w1cDnyilFU= |
| @128hxyvp | LX | xQpu++MOLLvQRks0CV5XEKGJTbYIeZSi5RJkNCyoOuwaHt96tBehoKurIEh/S2BzAl7rfflsuqgS6TcAwyiAO1hDhHpHZC+mOEnVc5vmy4fI4KSd8TwYPk2Te8QsyW1Ls8sOu29tJM/LQf1MzJ0GbgdB04t89/1O/w1cDnyilFU= |
| @525euwsy | MX | vMpjLiPbA4kVm5rczKAODQReWrajOcaZWqOEYTwMzgI/16H/ieJqnXY/mlxXkW5GoAgHlD0VsXAiyPHeeUxM+ZK/gDaExmjKEjTsol9bqmilS4Y3gfdF3lh9Ll7SfcjGjvjSmnJzBORoEiF49pDbaQdB04t89/1O/w1cDnyilFU= |
| @999hqlmk | CS | dvEdEP8a80tGP4wdobKmsv//MZoBJJjYwsu99R167MirrJSto6xdSzJTy8ybQSnFqjewl1wDArf8woZRpjULhsKWZryIcoid2bvMVu0diPb7tWcwzs4kMLTnl8ftNeW/tr1nFJu1vvJqGyDZXxoqpwdB04t89/1O/w1cDnyilFU= |
| @935bicyi | JS | WA0AAyabp495wh0FGa+O0hyCKxu24SIFfUdvYq+XCvYRWS+2mYHobHGBxRyvo+wh+ddEVMOjTacypAulP4b9l/qb4KxdfJnE9IYw1Hp0w/g3vpY9C0yDAT2ypGtARctnM1sp3+9TB0H1Ky1ltDoPtwdB04t89/1O/w1cDnyilFU= |
| @849rldxt | LS | vQqd7yTXJvJ0lr1GE6jIybygry6MKp8FU+/X3fqolqzyL3th9vjYrmaxgJzhUz5zuKuwlK77Nke6q9pfJ3wmmGTPlaNx+oXC5CYgQn9CthPA4GYlDSvTtCPzn6wViZnCHJgHuFTU/utlKoX07H/KogdB04t89/1O/w1cDnyilFU= |
| @001qlmgf | MS | 0+1SDnFis1yWjkeHMk6+F/s71U8wJryGRTGKMOdRN/vRAsAap3IzngaVTqs4e0cELDENZmSHfaDOwBYGbbzg5CTmyCIfhYw09mbr1nSeQIcgqKflOk+dt41H5RZzk4hSYwli4jCsaYzBKxxbm9iHqAdB04t89/1O/w1cDnyilFU= |
| @181pgtlc | - | WlRCzUPD+Y0Hda25W0T7GOOHczo6Po5icJHcp+auugiwrYQn+ZPzNKJwHZhoaonsbY2+kRDV3c108FPLpinNrPwIFY9Iz3XpueDHypnEeUoUH8kkqbIAiDGgS4dvH9qWIlIUAPETn9f4WZp/xW/CFwdB04t89/1O/w1cDnyilFU= |
| @448nzdkf | JB | X3yyU+FyGAMNz7XFZIJz7KvoFtlrlVLT61TI9g9nXK2m6V8RAlsT8LR8XyVv6hbw0s5v04d7xOAv8q2i4Peb2FSLa5PzRa/XGF36R6GNAI8EzND2DxudimpWtZ0xCmCq0Pl0Gx7TishapqKfKe5kMAdB04t89/1O/w1cDnyilFU= |
| @bn58     | LB | PTq4JsnqaY2Iv6YsQGlJ8Scm7RuXwS/r5rKOdVxLPLjfm0CqYCA5Uz0+6AIuNrgqVVjGZItFq00TM3rFE5eRKMbpv9EN4D1SCH9Z5d44oX9VWzHoUiafpxF9k0C7kOfIBOd4F5U3e6/sCwzrXJjfkQdB04t89/1O/w1cDnyilFU= |
| @734xzzse | MB | NB+/nMgRv8sIocIFk5qN7n5dwoeiLb0X7B6zidMvDJPun8yB6jOTx42OcejwsVgO8y8Gwk/ddQ8HViADMu4/rMyHxJ6kmObbQr5dt0wn6cEXO1Bxm+WZ/8W3yuiSgfAszddfGk5kC+XrqDuOTt0A/gdB04t89/1O/w1cDnyilFU= |

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [godview-tag-mapping.md](godview-tag-mapping.md) | 產品標籤與 LINE ID 的完整映射表 |
| [godview-line-oa-friends-auto-analysis.md](godview-line-oa-friends-auto-analysis.md) | 好友人數自動抓取技術調研 |
| [godview-line-config-spec.md](godview-line-config-spec.md) | line_config D1 表維護規範 |

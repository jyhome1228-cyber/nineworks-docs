(() => {
'use strict';
const KEY='nineworks-docs-v1';
const TYPES={quote:'견적서',compare:'비교견적서',contract:'용역계약서',statement:'거래명세서'};
const PAGES={dashboard:'대시보드',documents:'문서 관리',clients:'거래처 관리',settings:'기본정보 설정'};
const seed={supplier:{company:'나인웍스',representative:'',registration:'',address:'',businessType:'',businessItems:'',email:'',phone:'',account:''},clients:[],documents:[]};
let db=load(),view='dashboard',currentDoc=null,query='',typeFilter='all',toastTimer;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const won=n=>(Math.round(Number(n)||0)).toLocaleString('ko-KR')+'원';
const uid=()=> (crypto?.randomUUID?.() || 'id-'+Date.now()+'-'+Math.random().toString(36).slice(2));
const today=()=>{const d=new Date(Date.now()+9*60*60*1000);return d.toISOString().slice(0,10)};
function load(){try{const d=JSON.parse(localStorage.getItem(KEY));if(d&&typeof d==='object'&&Array.isArray(d.clients)&&Array.isArray(d.documents))return {...structuredClone(seed),...d,supplier:{...seed.supplier,...d.supplier}}}catch{}return structuredClone(seed)}
function save(){try{localStorage.setItem(KEY,JSON.stringify(db));return true}catch(e){notify('저장에 실패했습니다. 브라우저 저장 공간을 확인해 주세요.');return false}}
function notify(s){const el=$('toast');el.textContent=s;el.style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.style.display='none',3100)}
function fmt(s){return s ? String(s).slice(0,10).replace(/-/g,'.') : '—'}
function findClient(id){return db.clients.find(x=>x.id===id)}
const sum=d=>(d.items||[]).reduce((n,item)=>n+(+item.qty||0)*(+item.price||0),0);
const vat=d=>d.vatEnabled ? Math.round(sum(d)*0.1) : 0;
const amount=d=>sum(d)+vat(d);
function defaultClauses(){
return [
['제1조 (계약의 목적)','본 계약은 발주자가 수행자에게 본 계약서에 명시한 프로젝트의 기획 및 제작 업무를 위탁하고, 양 당사자의 권리와 의무를 정함을 목적으로 한다.'],
['제2조 (용역의 범위)','수행 범위와 주요 산출물은 계약서 및 별지의 기재 내용에 따른다. 세부 사항은 양 당사자가 협의하여 확정한다.'],
['제3조 (계약금액)','공급가액과 부가가치세는 본 계약서의 계약금액 표에 따른다.'],
['제4조 (대금 지급)','착수금은 계약 체결 후 지급하며, 잔금은 최종 검수 및 납품 완료 후 지급한다. 계약 범위를 초과하는 추가 업무는 별도 견적과 합의 후 진행한다.'],
['제5조 (계약기간)','계약기간과 완료 목표는 본 계약서에 명시한 날짜에 따른다. 발주자의 자료 전달·확정·피드백 지연 또는 불가항력으로 인한 일정 변경은 협의한다.'],
['제6조 (자료의 제공)','발주자는 제작에 필요한 원고, 이미지, 로고 등 자료를 제공하며, 제공 자료의 내용과 권리관계에 대한 책임을 진다. 별도 번역·촬영 등은 사전 합의에 따른다.'],
['제7조 (시안 및 수정)','기본 수정은 계약서에 명시한 횟수 내에서 진행한다. 방향의 전면 변경, 확정 시안 재설계, 신규 기능·페이지 추가는 추가 작업으로 협의한다.'],
['제8조 (검수 및 납품)','수행자는 작업 완료 후 검수를 요청하며, 발주자는 합리적인 기간 내 승인 또는 수정 사항을 회신한다. 계약 범위 내 오류는 보완하며 최종 승인 후 납품한다.'],
['제9조 (별도 비용)','도메인·호스팅·유료 라이선스·외부 솔루션 및 계약 범위를 넘는 업무는 별도 합의가 없는 한 계약금액에 포함되지 않는다.'],
['제10조 (저작권 및 사용권)','최종 결과물의 계약상 사용권은 대금 전액 지급 후 발주자에게 부여한다. 채택되지 않은 초안 및 중간 결과물의 권리는 수행자에게 있다. 제3자 자료는 해당 라이선스에 따른다. 수행자는 비공개 요청 자료를 제외하고 실적 소개에 활용할 수 있다.'],
['제11조 (비밀유지)','양 당사자는 계약 수행 과정에서 알게 된 상대방의 비공개 정보를 사전 동의 없이 제3자에게 제공하거나 목적 외 사용하지 않는다.'],
['제12조 (계약의 변경)','업무 범위·일정·비용의 변경은 양 당사자의 서면 또는 전자적 방식의 합의에 따른다.'],
['제13조 (계약의 해지)','중대한 의무 불이행이 시정되지 않는 경우 계약을 해지할 수 있다. 중도 종료 시 실제 수행된 업무를 기준으로 비용을 정산한다.'],
['제14조 (하자 및 유지보수)','납품 후 계약서에서 정한 기간 동안 계약 범위 내 오류를 무상 보완한다. 콘텐츠 변경·신규 기능·외부 정책 또는 서버 환경 변경에 따른 작업은 별도 협의한다.'],
['제15조 (분쟁의 해결)','계약에 명시되지 않은 사항은 관련 법령에 따르며 분쟁 발생 시 상호 협의로 해결하도록 노력한다.']
].map(([name,body])=>name+'\n'+body).join('\n\n')
}
function blankDoc(type='quote',clientId=''){return {id:uid(),type,number:'NW-'+today().slice(0,4)+String(Date.now()).slice(-6),title:'',clientId,date:today(),due:today(),vatEnabled:true,items:[{name:'',qty:1,price:0,note:''}],deposit:50,revision:'기본 디자인 수정 2회',maintenance:'납품 후 30일',scope:'',terms:'',clauses:defaultClauses(),createdAt:Date.now(),updatedAt:Date.now(),status:'초안'}}
function setView(v){view=v;currentDoc=null;query='';typeFilter='all';document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===v));$('breadcrumb').textContent=PAGES[v]||'문서 작성';closeMenu();render()}
function closeMenu(){$('sidebar').classList.remove('open');$('backdrop').classList.remove('open');}
function button(text,attrs='',cls='btn'){return '<button class="'+cls+'" '+attrs+'>'+text+'</button>'}
function pageHead(eye,title,desc,actions=''){return '<div class="page-top"><div><div class="eyebrow">'+eye+'</div><h1 class="page-title">'+title+'</h1><p class="page-desc">'+desc+'</p></div><div class="action-row">'+actions+'</div></div>'}
function render(){if(currentDoc){renderEditor();return}({dashboard:renderDashboard,documents:renderDocuments,clients:renderClients,settings:renderSettings}[view]||renderDashboard)()}
function renderDashboard(){
const docs=db.documents,contracts=docs.filter(d=>d.type==='contract'),latest=[...docs].sort((a,b)=>b.updatedAt-a.updatedAt).slice(0,6);
$('main').innerHTML=pageHead('DOCUMENT WORKSPACE','문서 업무를 한 곳에서.','프로젝트와 거래처 정보를 연결해 반복적인 문서 작성을 줄입니다.',button('+ 새 문서','data-action="new"','btn black'))+
'<div class="stats"><div class="metric"><div class="metric-label">작성 문서</div><div class="metric-value">'+docs.length+'</div><div class="metric-foot">저장된 문서 전체</div></div><div class="metric"><div class="metric-label">등록 거래처</div><div class="metric-value">'+db.clients.length+'</div><div class="metric-foot">고객사 및 공급사</div></div><div class="metric"><div class="metric-label">계약서</div><div class="metric-value">'+contracts.length+'</div><div class="metric-foot">작성된 계약 문서</div></div><div class="metric"><div class="metric-label">견적서</div><div class="metric-value">'+docs.filter(x=>x.type==='quote').length+'</div><div class="metric-foot">작성된 기본 견적서</div></div></div>'+
'<div class="section"><div class="section-head"><div><h2>빠른 문서 작성</h2><p>양식 선택 후 바로 작성할 수 있습니다.</p></div></div><div class="quick-grid">'+Object.entries(TYPES).map(([t,label],i)=>'<button class="quick" data-action="quick" data-type="'+t+'"><div class="quick-icon">'+['▤','▥','▣','▦'][i]+'</div><div><div class="quick-title">'+label+'</div><div class="quick-sub">새 문서 작성</div></div></button>').join('')+'</div></div>'+
'<div class="section"><div class="section-head"><div><h2>최근 작성 문서</h2><p>최근 수정된 문서부터 표시합니다.</p></div>'+button('문서 전체 보기','data-action="all"','btn small')+'</div>'+tableDocuments(latest)+'</div>'+
'<div class="notice"><span class="note-strong">1차 개발 안내.</span> 현재 문서는 이 브라우저에 저장됩니다. PDF는 브라우저의 인쇄 기능으로 생성하며, 기존 HWP·XLSX·DOCX 원본 레이아웃과 동일한 출력은 아직 구현하지 않았습니다.</div>';
}
function tableDocuments(list){
if(!list.length)return '<div class="empty">작성된 문서가 없습니다. 상단의 새 문서에서 시작하세요.</div>';
return '<div class="table-scroll"><table class="data-table"><thead><tr><th>문서명</th><th>거래처</th><th>종류</th><th>작성일</th><th>금액 (VAT 포함)</th><th>관리</th></tr></thead><tbody>'+list.map(d=>'<tr><td><button class="table-button" data-action="edit" data-id="'+esc(d.id)+'">'+esc(d.title||'제목 없는 문서')+'</button><div class="muted">'+esc(d.number)+'</div></td><td>'+esc(findClient(d.clientId)?.company||'미지정')+'</td><td><span class="pill">'+esc(TYPES[d.type])+'</span></td><td>'+fmt(d.date)+'</td><td>'+won(amount(d))+'</td><td><div class="action-row">'+button('편집','data-action="edit" data-id="'+esc(d.id)+'"','btn small')+button('복제','data-action="duplicate" data-id="'+esc(d.id)+'"','btn small')+'</div></td></tr>').join('')+'</tbody></table></div>';
}
function renderDocuments(){
const docs=[...db.documents].sort((a,b)=>b.updatedAt-a.updatedAt).filter(d=>(typeFilter==='all'||d.type===typeFilter)&&([d.title,d.number,findClient(d.clientId)?.company].join(' ').toLowerCase().includes(query.toLowerCase())));
$('main').innerHTML=pageHead('DOCUMENTS','문서 관리','작성한 문서를 검색하고 수정하거나 복제할 수 있습니다.',button('+ 새 문서','data-action="new"','btn black'))+
'<div class="section"><div class="filterbar"><input id="docSearch" class="input" placeholder="프로젝트명, 거래처명, 문서번호 검색" aria-label="문서 검색" value="'+esc(query)+'"><select id="docFilter" class="input" aria-label="문서 종류">'+[['all','모든 문서'],...Object.entries(TYPES)].map(([key,val])=>'<option value="'+key+'" '+(key===typeFilter?'selected':'')+'>'+esc(val)+'</option>').join('')+'</select><span class="muted">'+docs.length+'건</span></div>'+tableDocuments(docs)+'</div>';
}
function renderClients(){
$('main').innerHTML=pageHead('CLIENT DIRECTORY','거래처 관리','한 번 등록한 거래처 정보를 문서 작성에 반복 활용합니다.',button('+ 거래처 등록','data-action="addClient"','btn black'))+
'<div class="section">'+(!db.clients.length?'<div class="empty">등록된 거래처가 없습니다. 거래처를 먼저 등록해 주세요.</div>':'<div class="table-scroll"><table class="data-table"><thead><tr><th>업체명</th><th>대표자</th><th>사업자번호</th><th>연락처</th><th>관리</th></tr></thead><tbody>'+db.clients.map(c=>'<tr><td><strong>'+esc(c.company)+'</strong><div class="muted">'+esc(c.address||'')+'</div></td><td>'+esc(c.representative||'—')+'</td><td>'+esc(c.registration||'—')+'</td><td>'+esc(c.phone||c.email||'—')+'</td><td><div class="action-row">'+button('수정','data-action="editClient" data-id="'+esc(c.id)+'"','btn small')+button('삭제','data-action="deleteClient" data-id="'+esc(c.id)+'"','btn small danger')+'</div></td></tr>').join('')+'</tbody></table></div>')+'</div>';
}
function supplierForm(s){const fields=[['company','상호'],['representative','대표자'],['registration','사업자등록번호'],['address','주소'],['businessType','업태'],['businessItems','종목'],['email','이메일'],['phone','연락처'],['account','입금 계좌 안내']];return '<div class="grid-2">'+fields.map(([k,label])=>'<div class="field"><label for="sup-'+k+'">'+label+'</label><input id="sup-'+k+'" name="'+k+'" value="'+esc(s[k]||'')+'"></div>').join('')+'</div>'}
function renderSettings(){
$('main').innerHTML=pageHead('SETTINGS','기본정보 설정','공급자 기본정보와 문서 데이터를 관리합니다.')+
'<div class="section"><div class="section-head"><div><h2>나인웍스 공급자 정보</h2><p>견적서와 거래명세서, 계약서의 을(수행자) 영역에 사용됩니다.</p></div></div><form id="supplierForm" class="form-panel">'+supplierForm(db.supplier)+'<div class="action-row" style="margin-top:20px">'+button('기본정보 저장','type="submit"','btn black')+'</div></form></div>'+
'<div class="section"><div class="section-head"><div><h2>데이터 백업 및 복원</h2><p>현재 브라우저에 저장된 거래처, 기본정보, 문서를 JSON으로 저장합니다.</p></div></div><div class="form-panel"><div class="notice">개인정보와 계약금액이 포함될 수 있습니다. 백업 파일을 안전한 위치에 보관하고, GitHub 저장소에 업로드하지 마세요.</div><div class="action-row">'+button('JSON 백업 다운로드','data-action="export"','btn black')+'<label class="btn" for="jsonImport">JSON 백업 불러오기</label><input id="jsonImport" type="file" accept=".json,application/json" hidden></div></div></div>';
}
function clientOptions(id){return '<option value="">거래처 선택</option>'+db.clients.map(c=>'<option value="'+esc(c.id)+'" '+(id===c.id?'selected':'')+'>'+esc(c.company)+'</option>').join('')}
function renderEditor(){
const d=currentDoc;$('breadcrumb').textContent=TYPES[d.type]+' 작성';
const title=d.type==='contract'?'계약 조건':d.type==='statement'?'거래 내역':'견적 내역';
$('main').innerHTML=pageHead('DOCUMENT EDITOR',TYPES[d.type]+' 작성','정보를 수정하면 오른쪽 문서 미리보기에 반영됩니다.',
button('문서 목록','data-action="back"')+button('저장','data-action="save"','btn black')+button('인쇄 / PDF 저장','data-action="print"'))+
'<div class="editor-layout"><div class="editor-left">'+
'<section class="editor-section"><h2>문서 기본정보</h2><div class="grid-2">'+
field('프로젝트 / 문서명','title',d.title,'text')+field('문서번호','number',d.number,'text')+
'<div class="field"><label for="ed-type">문서 종류</label><select id="ed-type" data-field="type">'+Object.entries(TYPES).map(([k,v])=>'<option value="'+k+'" '+(k===d.type?'selected':'')+'>'+v+'</option>').join('')+'</select></div>'+
'<div class="field"><label for="ed-clientId">거래처</label><select id="ed-clientId" data-field="clientId">'+clientOptions(d.clientId)+'</select></div>'+
field('작성일','date',d.date,'date')+field('완료 예정일 / 유효기간','due',d.due,'date')+
'</div><div style="margin-top:12px">'+button('+ 거래처 등록','data-action="addClient"','btn small')+'</div></section>'+
'<section class="editor-section"><h2>'+title+'</h2><div class="item-editor"><span class="muted">항목</span><span class="muted">수량</span><span class="muted">단가(원)</span></div><div id="itemsEditor">'+itemsEditor(d)+'</div>'+button('+ 항목 추가','data-action="addItem"','btn small')+'<div class="line"></div><div class="grid-2"><div class="field"><label for="ed-vat">부가세</label><select id="ed-vat" data-field="vatEnabled"><option value="true" '+(d.vatEnabled?'selected':'')+'>부가세 10% 별도</option><option value="false" '+(!d.vatEnabled?'selected':'')+'>부가세 미적용</option></select></div><div class="field"><label for="ed-deposit">착수금 비율 (%)</label><input id="ed-deposit" type="number" data-field="deposit" min="0" max="100" value="'+esc(d.deposit)+'"></div></div><div id="totals">'+totals(d)+'</div></section>'+
'<section class="editor-section"><h2>추가 조건</h2>'+
textareaField('업무 범위 / 주요 산출물','scope',d.scope,4)+
textareaField('안내사항 및 지급 조건','terms',d.terms,4)+
(d.type==='contract'?'<div class="grid-2">'+field('수정 조건','revision',d.revision)+field('무상 보완 기간','maintenance',d.maintenance)+'</div>'+textareaField('계약 본문 (수정 가능)','clauses',d.clauses,17):'')+
'<p class="help">계약 조항은 예시 원본을 기반으로 정리한 초안입니다. 발행 전 실제 사업 범위와 법적 조건을 검토하세요.</p></section>'+
'<div class="editor-actions">'+button('저장','data-action="save"','btn black')+button('다른 문서로 복제','data-action="makeRelated"')+button('문서 삭제','data-action="deleteDoc"','btn danger')+'</div></div>'+
'<div class="editor-right"><div class="preview-head"><strong>실시간 미리보기</strong><span>A4 인쇄용 · 1차 양식</span></div><div class="preview-wrap"><div id="paperPreview">'+renderPaper(d)+'</div></div><p class="help" style="margin-top:11px">원본 문서 형식과 완전히 동일한 재현이 아닌 웹 출력 템플릿입니다.</p></div></div><div id="printHost" hidden></div>';
}
function field(label,key,val,type='text'){return '<div class="field"><label for="ed-'+key+'">'+label+'</label><input id="ed-'+key+'" data-field="'+key+'" type="'+type+'" value="'+esc(val)+'"></div>'}
function textareaField(label,key,val,rows){return '<div class="field" style="margin-bottom:17px"><label for="ed-'+key+'">'+label+'</label><textarea id="ed-'+key+'" rows="'+rows+'" data-field="'+key+'">'+esc(val)+'</textarea></div>'}
function itemsEditor(d){return d.items.map((i,n)=>'<div class="item-editor"><input aria-label="항목 '+(n+1)+'" data-item="'+n+'" data-prop="name" value="'+esc(i.name)+'" placeholder="품목 / 업무명"><input aria-label="수량" type="number" min="0" step="1" data-item="'+n+'" data-prop="qty" value="'+esc(i.qty)+'"><input aria-label="단가" type="number" min="0" step="1" data-item="'+n+'" data-prop="price" value="'+esc(i.price)+'"><button data-action="removeItem" data-index="'+n+'" aria-label="항목 삭제" title="삭제">×</button></div>').join('')}
function totals(d){let s=sum(d),v=vat(d),a=amount(d),dep=Math.round(a*(Math.max(0,Math.min(100,+d.deposit||0))/100));return '<div class="sum-box"><span class="muted">공급가액</span><strong>'+won(s)+'</strong></div><div class="sum-box"><span class="muted">부가세</span><strong>'+won(v)+'</strong></div><div class="sum-box"><span>합계</span><strong>'+won(a)+'</strong></div><div class="sum-box"><span class="muted">착수금 / 잔금</span><span>'+won(dep)+' / '+won(a-dep)+'</span></div>'}
function companyTable(x){return '<table><tbody><tr><th>상호</th><td>'+esc(x.company||'—')+'</td><th>대표자</th><td>'+esc(x.representative||'—')+'</td></tr><tr><th>사업자번호</th><td colspan="3">'+esc(x.registration||'—')+'</td></tr><tr><th>주소</th><td colspan="3">'+esc(x.address||'—')+'</td></tr><tr><th>연락처</th><td colspan="3">'+esc(x.phone||x.email||'—')+'</td></tr></tbody></table>'}
function paperRows(d){return '<table><thead><tr><th style="width:40%">품명 / 용역 내용</th><th class="numeric">수량</th><th class="numeric">단가</th><th class="numeric">공급가액</th></tr></thead><tbody>'+d.items.map(i=>'<tr><td>'+esc(i.name||'—')+'</td><td class="numeric">'+esc(i.qty)+'</td><td class="numeric">'+won(i.price)+'</td><td class="numeric">'+won((+i.qty||0)*(+i.price||0))+'</td></tr>').join('')+'<tr><th colspan="3">공급가액</th><td class="numeric">'+won(sum(d))+'</td></tr><tr><th colspan="3">부가세</th><td class="numeric">'+won(vat(d))+'</td></tr><tr><th colspan="3">합계</th><td class="numeric"><strong>'+won(amount(d))+'</strong></td></tr></tbody></table>'}
function renderPaper(d){
const client=findClient(d.clientId)||{},supplier=d.type==='compare'?client:db.supplier,receiver=d.type==='compare'?db.supplier:client;
const total=amount(d),dep=Math.round(total*(Math.max(0,Math.min(100,+d.deposit||0))/100));
const name=esc(d.title||'프로젝트명 미입력'),data='<div class="paper-meta"><div><strong>문서번호</strong> '+esc(d.number)+'<br><strong>작성일</strong> '+fmt(d.date)+'<br><strong>완료일 / 유효기간</strong> '+fmt(d.due)+'</div><div style="text-align:right"><strong>공급자</strong> '+esc(supplier.company||'미지정')+'<br><strong>수신처</strong> '+esc(receiver.company||'미지정')+'</div></div>';
const head='<article class="paper"><h2>'+name+' '+TYPES[d.type]+'</h2>'+data;
if(d.type==='contract'){
const clauses=esc(d.clauses||'').split(/\n\n+/).map(p=>{const rows=p.split('\n');return '<section><h3>'+esc(rows[0]||'')+'</h3><div>'+rows.slice(1).join('<br>')+'</div></section>'}).join('');
return head+'<p><strong>갑(발주자):</strong> '+esc(client.company||'미지정')+'　 <strong>을(수행자):</strong> '+esc(db.supplier.company||'나인웍스')+'</p><p style="margin-top:10px"><strong>계약기간:</strong> '+fmt(d.date)+' ~ '+fmt(d.due)+'</p>'+paperRows(d)+'<p><strong>착수금:</strong> '+won(dep)+'　 <strong>잔금:</strong> '+won(total-dep)+'</p>'+(d.scope?'<p class="footnote"><strong>수행 범위</strong><br>'+esc(d.scope)+'</p>':'')+'<div class="clauses">'+clauses+'</div><div class="sign-grid"><div><strong>갑 (발주자)</strong><br>'+esc(client.company||'')+'<br>대표자: '+esc(client.representative||'')+' (인)<br>사업자번호: '+esc(client.registration||'')+'<br>'+esc(client.address||'')+'</div><div><strong>을 (수행자)</strong><br>'+esc(db.supplier.company)+'<br>대표자: '+esc(db.supplier.representative||'')+' (인)<br>사업자번호: '+esc(db.supplier.registration||'')+'<br>'+esc(db.supplier.address||'')+'</div></div><p class="footnote"><strong>별지 1. 용역 범위</strong><br>주요 산출물: '+esc(d.scope||'별도 협의')+'<br>수정 조건: '+esc(d.revision)+'<br>무상 보완: '+esc(d.maintenance)+'<br>'+esc(d.terms)+'</p></article>';
}
return head+'<p><strong>수신처</strong> '+esc(receiver.company||'미지정')+' 귀중</p><p style="margin-top:7px">아래와 같이 '+(d.type==='statement'?'거래 내역을 안내드립니다.':'견적을 제출합니다.')+'</p>'+companyTable(supplier)+paperRows(d)+'<p class="total">합계금액　'+won(total)+'</p><div class="footnote"><strong>업무 범위 및 비고</strong><br>'+esc(d.scope||'—')+'<br><br><strong>결제 및 기타 조건</strong><br>착수금 '+won(dep)+' / 잔금 '+won(total-dep)+'<br>'+esc(d.terms||'—')+'</div><div class="sign">'+esc(supplier.company||'공급자 미지정')+' (인)</div><div class="tagline">NINEWORKS</div></article>';
}
function updatePreview(){if(!currentDoc)return;const paper=$('paperPreview'),tot=$('totals');if(paper)paper.innerHTML=renderPaper(currentDoc);if(tot)tot.innerHTML=totals(currentDoc)}
function persist(){currentDoc.updatedAt=Date.now();const idx=db.documents.findIndex(x=>x.id===currentDoc.id);if(idx>=0)db.documents[idx]=structuredClone(currentDoc);else db.documents.unshift(structuredClone(currentDoc));save()}
function startDoc(type,clientId=''){currentDoc=blankDoc(type,clientId);view='documents';renderEditor()}
function modal(title,fields,onConfirm){$('modalTitle').textContent=title;$('modalContent').innerHTML=fields;$('modalConfirm').onclick=e=>{e.preventDefault();const values=Object.fromEntries(new FormData($('modal').querySelector('form')));if(onConfirm(values)!==false)$('modal').close()};$('modal').showModal()}
function clientModal(id){const c=findClient(id)||{company:'',representative:'',registration:'',address:'',phone:'',email:''};const f=['company','representative','registration','address','phone','email'],labels=['업체명 (필수)','대표자','사업자번호','주소','연락처','이메일'];
modal(id?'거래처 수정':'거래처 등록',f.map((k,i)=>'<div class="field"><label for="m-'+k+'">'+labels[i]+'</label><input id="m-'+k+'" name="'+k+'" value="'+esc(c[k]||'')+'" '+(k==='company'?'required':'')+'></div>').join(''),v=>{
if(!v.company?.trim()){notify('업체명을 입력하세요.');return false}
if(id){Object.assign(c,v)}else{db.clients.push({id:uid(),...v})}save();if(currentDoc){if(!id)currentDoc.clientId=db.clients.at(-1).id;renderEditor()}else render();notify('거래처를 저장했습니다.');
})}
function newModal(){modal('새 문서 작성','<div class="field"><label for="m-type">문서 종류</label><select name="type" id="m-type">'+Object.entries(TYPES).map(([k,v])=>'<option value="'+k+'">'+v+'</option>').join('')+'</select></div><div class="field"><label for="m-client">거래처 (선택)</label><select name="clientId" id="m-client">'+clientOptions('')+'</select></div>',v=>startDoc(v.type,v.clientId))}
function relatedModal(){modal('관련 문서 만들기','<p class="muted">현재 문서의 거래처, 항목, 금액을 복사합니다. 실제 지급 조건과 계약 내용을 확인한 뒤 발행하세요.</p><div class="field"><label for="m-type">문서 종류</label><select id="m-type" name="type">'+Object.entries(TYPES).map(([k,v])=>'<option value="'+k+'">'+v+'</option>').join('')+'</select></div>',v=>{persist();let copy=structuredClone(currentDoc);copy.id=uid();copy.type=v.type;copy.number='NW-'+today().slice(0,4)+String(Date.now()).slice(-6);copy.createdAt=Date.now();copy.updatedAt=Date.now();copy.status='초안';currentDoc=copy;renderEditor();notify('관련 문서 초안을 만들었습니다.')})}
function download(name,content,mime){const blob=new Blob([content],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
document.addEventListener('click',e=>{
const btn=e.target.closest('[data-action]');if(!btn)return;
const act=btn.dataset.action,id=btn.dataset.id;
if(act==='new')return newModal();
if(act==='quick')return startDoc(btn.dataset.type);
if(act==='all')return setView('documents');
if(act==='back'){if(currentDoc)persist();return setView('documents')}
if(act==='edit'){currentDoc=structuredClone(db.documents.find(d=>d.id===id));return renderEditor()}
if(act==='duplicate'){const original=db.documents.find(d=>d.id===id);if(!original)return;const copy=structuredClone(original);copy.id=uid();copy.title=copy.title+' (복제)';copy.number='NW-'+today().slice(0,4)+String(Date.now()).slice(-6);copy.createdAt=Date.now();copy.updatedAt=Date.now();currentDoc=copy;return renderEditor()}
if(act==='save'){persist();notify('문서를 저장했습니다.');return}
if(act==='addClient')return clientModal();
if(act==='editClient')return clientModal(id);
if(act==='deleteClient'){const c=findClient(id);if(c&&confirm(c.company+' 거래처를 삭제하시겠습니까? 기존 문서의 거래처 연결이 해제됩니다.')){db.clients=db.clients.filter(x=>x.id!==id);save();render()}return}
if(act==='addItem'){currentDoc.items.push({name:'',qty:1,price:0,note:''});$('itemsEditor').innerHTML=itemsEditor(currentDoc);updatePreview();return}
if(act==='removeItem'){if(currentDoc.items.length===1)return notify('항목은 최소 1개가 필요합니다.');currentDoc.items.splice(+btn.dataset.index,1);$('itemsEditor').innerHTML=itemsEditor(currentDoc);updatePreview();return}
if(act==='makeRelated')return relatedModal();
if(act==='deleteDoc'){if(confirm('현재 문서를 삭제하시겠습니까?')){db.documents=db.documents.filter(d=>d.id!==currentDoc.id);save();setView('documents');notify('문서를 삭제했습니다.')}return}
if(act==='print'){persist();$('printHost').innerHTML=renderPaper(currentDoc);$('printHost').hidden=false;window.print();setTimeout(()=>{$('printHost').hidden=true},1500);return}
if(act==='export'){download('nineworks-docs-backup-'+today()+'.json',JSON.stringify({version:1,exportedAt:new Date().toISOString(),data:db},null,2),'application/json');return}
});
document.addEventListener('input',e=>{
if(e.target.id==='docSearch'){query=e.target.value;const start=e.target.selectionStart;renderDocuments();const input=$('docSearch');input.focus();input.setSelectionRange(start,start);return}
if(!currentDoc)return;
const el=e.target;
if(el.dataset.field){let val=el.value;if(el.dataset.field==='deposit')val=Math.max(0,Math.min(100,+val||0));if(el.dataset.field==='vatEnabled')val=val==='true';currentDoc[el.dataset.field]=val;if(el.dataset.field==='type')return renderEditor();updatePreview()}
if(el.dataset.item!==undefined){const item=currentDoc.items[+el.dataset.item];if(!item)return;item[el.dataset.prop]=['qty','price'].includes(el.dataset.prop)?Math.max(0,+el.value||0):el.value;updatePreview()}
});
document.addEventListener('change',async e=>{
if(e.target.id==='docFilter'){typeFilter=e.target.value;renderDocuments()}
if(e.target.id==='jsonImport'){const file=e.target.files?.[0];if(!file)return;try{const parsed=JSON.parse(await file.text()),incoming=parsed.data;if(!incoming||!Array.isArray(incoming.clients)||!Array.isArray(incoming.documents)||typeof incoming.supplier!=='object')throw Error('형식 오류');if(!confirm('현재 브라우저의 모든 데이터를 백업 파일로 교체하시겠습니까?'))return;db={supplier:{...seed.supplier,...incoming.supplier},clients:incoming.clients,documents:incoming.documents};save();setView('dashboard');notify('백업을 불러왔습니다.')}catch{notify('올바른 NINEWORKS DOCS 백업 파일이 아닙니다.')}e.target.value=''}
});
document.addEventListener('submit',e=>{if(e.target.id!=='supplierForm')return;e.preventDefault();Object.assign(db.supplier,Object.fromEntries(new FormData(e.target)));save();notify('기본정보를 저장했습니다.')});
$('nav').addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(b)setView(b.dataset.view)});
$('newTop').addEventListener('click',newModal);
$('menuToggle').addEventListener('click',()=>{$('sidebar').classList.toggle('open');$('backdrop').classList.toggle('open')});
$('backdrop').addEventListener('click',closeMenu);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
render();
})();
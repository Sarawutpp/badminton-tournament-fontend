import React from 'react';
export default class ErrorBoundary extends React.Component{
constructor(p){ super(p); this.state={error:null}; }
static getDerivedStateFromError(e){ return { error: e }; }
componentDidCatch(e, info){ console.error('Render error:', e, info); }
render(){
if (this.state.error){
return <div style={{padding:16, border:'1px solid #f00', background:'#fee'}}>
<h3 style={{marginTop:0}}>Something went wrong</h3>
<pre style={{whiteSpace:'pre-wrap'}}>{String(this.state.error?.message || this.state.error)}</pre>
</div>;
}
return this.props.children;
}
}
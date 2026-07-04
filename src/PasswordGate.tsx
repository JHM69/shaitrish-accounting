import {useState, type ReactNode} from 'react';

// ponytail: password lives in the JS bundle — casual gate only, NOT real security.
// Anyone with DevTools can read it. For real protection use Vercel Pro Password Protection.
const PASSWORD = '333777';
const KEY = 'gate_ok';

export default function PasswordGate({children}: {children: ReactNode}) {
  const [ok, setOk] = useState(() => sessionStorage.getItem(KEY) === '1');
  const [val, setVal] = useState('');
  const [err, setErr] = useState(false);

  if (ok) return <>{children}</>;

  return (
    <div style={{display: 'grid', placeItems: 'center', minHeight: '100vh', gap: 12}}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (val === PASSWORD) {
            sessionStorage.setItem(KEY, '1');
            setOk(true);
          } else {
            setErr(true);
          }
        }}
        style={{display: 'grid', gap: 8, width: 240}}
      >
        <input
          type="password"
          value={val}
          onChange={(e) => {
            setVal(e.target.value);
            setErr(false);
          }}
          placeholder="Password"
          autoFocus
          style={{padding: 8}}
        />
        <button type="submit" style={{padding: 8}}>
          Enter
        </button>
        {err && <span style={{color: 'crimson', fontSize: 13}}>Wrong password</span>}
      </form>
    </div>
  );
}

const styles = {
  body: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 24px',
  },
  card: {
    background: '#ffffff',
    border: '1px solid #e2e6ea',
    borderRadius: '14px',
    padding: '56px 72px',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06)',
    textAlign: 'center',
    maxWidth: '640px',
    width: '100%',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#1e2530',
    marginBottom: '12px',
    letterSpacing: '0.3px',
  },
  sub: {
    fontSize: '0.95rem',
    color: '#6b7280',
  },
}

function SaffronBody() {
  return (
    <section style={styles.body}>
      <div style={styles.card}>
        <h1 style={styles.title}>Saffron 에 오신 것을 환영합니다.</h1>
        <p style={styles.sub}>상단 메뉴를 클릭하여 시작하세요.</p>
      </div>
    </section>
  )
}

export default SaffronBody

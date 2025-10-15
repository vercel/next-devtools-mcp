type PageProps = {
  params: {
    id: string
  }
}

function getUserData(id: string) {
  return {
    id,
    name: `User ${id}`,
    email: `user${id}@example.com`,
    createdAt: new Date().toISOString(),
    role: 'member'
  }
}

export default function UserPage({ params }: PageProps) {
  const user = getUserData(params.id)

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>User Profile</h1>
      <div style={{ marginTop: '1rem' }}>
        <p><strong>ID:</strong> {user.id}</p>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role}</p>
        <p><strong>Created:</strong> {user.createdAt}</p>
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'

function SignupPage() {
  return <>
    <h1>Signup Page</h1>
    <Link to="/login">Already have an account? Login here.</Link>
  </>
}

export default SignupPage
import { login } from './actions';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  return (
    <div className='flex justify-center pt-40'>
      <form className='flex flex-col gap-3' autoComplete='off'>
        <div>
          <label className='' htmlFor='email'>
            Email:
          </label>
          <input
            className='block'
            id='email'
            name='email'
            type='email'
            required
          />
        </div>

        <div>
          <label htmlFor='password'>Password:</label>
          <input
            className='block'
            id='password'
            name='password'
            type='password'
            required
          />
        </div>

        <Button formAction={login}>Log in</Button>
      </form>
    </div>
  );
}

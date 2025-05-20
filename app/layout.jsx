import { Exo_2 } from 'next/font/google';
import './globals.css'

const exo2 = Exo_2({ subsets: ['latin'], variable: '--font-exo2' });

export default function Layout({ children }) {
  //  return children
  return (
    <html className={exo2.className}>
      <body>
        {children}
      </body>
    </html>
  )
}
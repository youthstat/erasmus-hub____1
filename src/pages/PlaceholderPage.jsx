import Header from '../components/layout/Header.jsx';

export default function PlaceholderPage({ title }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Header back />
      <div className="box shadow-b8 p-10">
        <h1 className="text-2xl sm:text-3xl font-extrabold uppercase">{title}</h1>
        <p className="mt-3 text-mute">This page will be added later.</p>
      </div>
    </div>
  );
}

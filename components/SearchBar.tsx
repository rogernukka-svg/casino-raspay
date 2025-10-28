export default function SearchBar() {
  return (
    <div className="mt-5 flex w-full gap-3">
      <select className="w-40 rounded-lg border border-subtle bg-brand.card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500">
        <option>Casino</option>
        <option>Slots</option>
        <option>Live</option>
        <option>Table</option>
      </select>
      <input
        className="flex-1 rounded-lg border border-subtle bg-brand.card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
        placeholder="Search your game"
      />
      <button className="rounded-lg bg-emerald-600 px-4 text-sm font-medium hover:bg-emerald-500">
        Buscar
      </button>
    </div>
  );
}

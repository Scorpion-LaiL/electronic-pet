type MessagePanelProps = {
  title: string;
  messages: string[];
};

export function MessagePanel({ title, messages }: MessagePanelProps) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h3>{title}</h3>
        <p>这里会记录最近的反馈和状态提示。</p>
      </div>
      <div className="message-list">
        {messages.map((message, index) => (
          <div className="message-item" key={`${message}-${index}`}>
            {message}
          </div>
        ))}
      </div>
    </section>
  );
}

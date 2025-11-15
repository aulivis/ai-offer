-- Migration: Add 'question' decision type to offer_responses
-- This migration allows customers to ask questions about offers in addition to accepting/rejecting

-- Alter the offer_responses table to allow 'question' as a decision type
alter table public.offer_responses
drop constraint if exists offer_responses_decision_check;

alter table public.offer_responses
add constraint offer_responses_decision_check
check (decision in ('accepted', 'rejected', 'question'));

-- Update the notification trigger to handle questions
create or replace function public.handle_offer_response()
returns trigger as $$
declare
  v_offer_user_id uuid;
  v_offer_title text;
  v_customer_name text;
begin
  -- Get offer details
  select user_id, title into v_offer_user_id, v_offer_title
  from public.offers
  where id = new.offer_id;
  
  -- Exit if offer not found
  if v_offer_user_id is null then
    return new;
  end if;
  
  -- Get customer name from response, share, or default
  v_customer_name := coalesce(
    new.customer_name,
    (select customer_name from public.offer_shares where id = new.share_id),
    'Customer'
  );
  
  -- Update offer status and decision (only for accepted/rejected, not questions)
  if new.decision in ('accepted', 'rejected') then
    update public.offers
    set 
      status = case 
        when new.decision = 'accepted' then 'accepted'
        when new.decision = 'rejected' then 'lost'
        else status
      end,
      decision = new.decision,
      decided_at = new.created_at,
      sent_at = coalesce(sent_at, new.created_at) -- Set sent_at if not already set
    where id = new.offer_id;
  end if;
  
  -- Create notification for offer creator
  insert into public.offer_notifications (
    offer_id,
    user_id,
    type,
    title,
    message,
    metadata
  ) values (
    new.offer_id,
    v_offer_user_id,
    'response',
    case 
      when new.decision = 'accepted' then 'Offer Accepted'
      when new.decision = 'rejected' then 'Offer Rejected'
      when new.decision = 'question' then 'Question About Offer'
      else 'Offer Response'
    end,
    case 
      when new.decision = 'accepted' 
        then v_customer_name || ' accepted your offer "' || coalesce(v_offer_title, 'Untitled') || '"'
      when new.decision = 'rejected'
        then v_customer_name || ' rejected your offer "' || coalesce(v_offer_title, 'Untitled') || '"'
      when new.decision = 'question'
        then v_customer_name || ' has a question about your offer "' || coalesce(v_offer_title, 'Untitled') || '"'
      else 
        v_customer_name || ' responded to your offer "' || coalesce(v_offer_title, 'Untitled') || '"'
    end,
    jsonb_build_object(
      'decision', new.decision,
      'customer_name', v_customer_name,
      'customer_email', new.customer_email,
      'comment', new.comment,
      'response_id', new.id,
      'share_id', new.share_id
    )
  );
  
  return new;
end;
$$ language plpgsql security definer;

comment on function public.handle_offer_response() is 'Trigger function that updates offer status (for accepted/rejected) and creates notifications when customers respond to shared offers.';





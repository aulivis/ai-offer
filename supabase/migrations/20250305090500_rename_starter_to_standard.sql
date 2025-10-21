-- Normalize historical plan values to the new "standard" tier name.
update profiles
   set plan = 'standard'
 where plan = 'starter';
